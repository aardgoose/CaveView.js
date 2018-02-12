
import {
	LineSegments,
	Geometry,
	Color
} from '../Three';

//const red = new Color( 0xff0000 );
const yellow = new Color( 0xffff00 );

function Beckeriser ( segments, material ) {

	const self = this;
	LineSegments.call( this, new Geometry(), material );

	this.beginEdges();

	segments.forEach( _addSegment );

	this.endEdges();

	return this;

	function _addSegment( segment ) {

		self.addEdge( segment.startStation, segment.endStation );

	}

}

Beckeriser.prototype = Object.create( LineSegments.prototype );

Beckeriser.prototype.trim = function (/*  n  */ ) {

	const limit = this.logAvg - this.logSd * 0.2;
	const edges = this.edges;

	// trim of side branches (totalHits [ 1 | > 2 ] )

	this.beginEdges();

	var i;

	for ( i = 0; i < edges.length; i++ ) {

		const edge = edges[ i ];

		const s1 = edge.s1;
		const s2 = edge.s2;

		if ( edge.logL < limit && ( s1.hitCount === 1 || s2.hitCount === 1 ) ) {

			const keep = ( s1.hitCount === 1 ) ? s2 : s1;

			if ( keep.hitCount > 2 && ! keep.pruned) {

				keep.hitCount--;
				continue;

			}

			keep.pruned = true;

		}

		this.addEdge( s1, s2 );

	}

	this.endEdges();

	this.merge();
	this.merge();

};

Beckeriser.prototype.merge = function (/*  n  */ ) {

	const self = this;
	const limit = this.logAvg + this.logSd;

	const edges = this.edges;
	const drops = new Map();

	// merge two legs together ( hitCount = 2 )

	var i;

	for ( i = 0; i < edges.length; i++ ) {

		const edge = edges[ i ];

		const s1 = edge.s1;
		const s2 = edge.s2;

		if ( edge.logL < limit && ( s1.hitCount === 2 || s2.hitCount === 2 ) ) {

			drops.set( ( s1.hitCount === 2 ) ? s1 : s2, [] );

		}

	}

	this.beginEdges();

	for ( i = 0; i < edges.length; i++ ) {

		const edge = edges[ i ];

		const s1 = edge.s1;
		const s2 = edge.s2;

		let edit;

		// handle edges where one station is being removed

		edit = drops.get( s1 );

		if ( edit !== undefined ) {

			edit.push( s2 );
			continue;

		}

		edit = drops.get( s2 );

		if ( edit !== undefined ) {

			edit.push( s1 );
			continue;

		}

		this.addEdge( s1, s2 );

	}

	// add new edges created after removing a side branch

	drops.forEach( function _addEdits ( value /*, key */ ) {

		// skip incomplete edits (adjacent edits not supported )

		if ( value.length !== 2 ) return;

		self.addEdge( value[ 0 ], value[ 1 ] );

	} );

	this.endEdges();

};

Beckeriser.prototype.beginEdges =  function () {

	this.edges = [];

	this.s1 = 0;
	this.s2 = 0;

	this.s1Log = 0;
	this.s2Log = 0;

	this.geometry.dispose();
	this.geometry = new Geometry();

};

Beckeriser.prototype.endEdges =  function () {

	const edges = this.edges;
	const n = edges.length;

	const sd = Math.sqrt( this.s2 / n - Math.pow( this.s1 / n, 2 ) );
	const sdl = Math.sqrt( this.s2Log / n - Math.pow( this.s1Log / n, 2 ) );

	const avg = this.s1 / n;
	const avgl = this.s1Log / n;

	console.log( 'avg', avg, 'sd', sd );
	console.log( 'avg', avgl, 'sd', sdl );

	this.logAvg = avgl;
	this.logSd = sdl;

	edges.sort( function _sortLegs ( a, b ) { return a.length - b.length; } );

	this.needsUpdate = true;

};

Beckeriser.prototype.addEdge =  function ( start, end ) {

	const v1 = start.p;
	const v2 = end.p;

	const length = v1.distanceTo( v2 );
	const logL = Math.log( length );

	const vertices = this.geometry.vertices;
	const colors = this.geometry.colors;

	// stats for legs
	if ( length === 0 ) return;

	this.s1 += length;
	this.s2 += length * length;

	this.s1Log += logL;
	this.s2Log += logL * logL;

	// get lengths and hitcounts for each edge of network

	vertices.push( v1 );
	vertices.push( v2 );

	colors.push( yellow, yellow );

	const edges = this.edges;

	edges.push( {
		vIndex: edges.length,
		length: length,
		logL: logL,
		s1: start,
		s2: end,
		remove: false
	} );

};

export { Beckeriser };

