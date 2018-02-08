
import {
	LineBasicMaterial,
	LineSegments,
	Geometry,
	Vector3,
	Color,
	VertexColors
} from '../Three';


const red = new Color( 0xff0000 );
const yellow = new Color( 0xffff00 );

function Beckeriser ( segments, stations ) {

	const geometry = new Geometry();

	const colors = geometry.colors;
	const vertices = geometry.vertices;
	const edges = [];

	var s1 = 0, s2 = 0, n = 0;
	var sl1 = 0, sl2 = 0;

	segments.forEach( _addSegment );

	const sd = Math.sqrt( s2 / n - Math.pow( s1 / n, 2 ) );
	const sdl = Math.sqrt( sl2 / n - Math.pow( sl1 / n, 2 ) );

	const avg = s1 / n;
	const avgl = sl1 / n;

	console.log( 'avg', avg, 'sd', sd );
	console.log( 'avg', avgl, 'sd', sdl );

	edges.sort( function _sortLegs ( a, b ) { return b.length - a.length; } );

	console.log( edges );

	this.edges = edges;
	this.stations = stations;

	this.logAvg = avgl;
	this.logSd = sdl;

//	geometry.vertices = vertices;
//	geometry.colors = colors;

	LineSegments.call( this, geometry, new LineBasicMaterial( { color: 0xffffff, vertexColors: VertexColors } ) );

	return this;

	function _addSegment( value /*, key */ ) {


		const start = value.startStation;
		const end = value.endStation;
		const v1 = start.p;
		const v2 = end.p;

		const length = v1.distanceTo( v2 );
		const logL = Math.log( length );

		// stats for legs
		if ( length === 0 ) return;

		s1 += length;
		s2 += length * length;

		sl1 += logL;
		sl2 += logL * logL;

		// get lengths and hitcounts for each edge of network

		edges.push( {
			vIndex: n++,
			length: length,
			logL: logL,
			s1: start,
			s2: end,
			remove: false
		} );

		vertices.push( v1 );
		vertices.push( v2 );

		colors.push( yellow, yellow );

	}

}

Beckeriser.prototype = Object.create( LineSegments.prototype );

Beckeriser.prototype.trim = function ( n ) {

	var geometry = this.geometry;
	var vertices = geometry.vertices;
	var colors = geometry.colors;

	const limit = this.logAvg - this.logSd;

	const edges = this.edges;
	const edits = new Map();

	// trim of side branches (totalHits [ 1 | > 2 ] )

	var i;

	for ( i = 0; i < edges.length; i++ ) {

		const edge = edges[ i ];

		const s1 = edge.s1;
		const s2 = edge.s2;

		if ( edge.logL < limit ) {

			const keep = ( s1.hitCount === 1 ) ? s2 : s1;

			if ( keep.hitCount === 3 ) {

				edits.set( ( s1.hitCount === 1 ) ? s2 : s1, [] );
				edge.remove = true;

			} else if ( keep.hitCount > 3 ) {

				keep.hitCount--;
				edge.remove = true;

			}

		}

	}

	const newEdges = [];

	for ( i = 0; i < edges.length; i++ ) {

		const edge = edges[ i ];

		const s1 = edge.s1;
		const s2 = edge.s2;

		if ( edge.remove ) continue;

		let edit;

		edit = edits.get( s1 );

		if ( edit !== undefined ) {

			edit.push( s2 );
			continue;

		}

		edit = edits.get( s2 );

		if ( edit !== undefined ) {

			edit.push( s1 );
			continue;

		}

		newEdges.push( edge );

	}

	geometry.dispose();

	geometry = new Geometry();

	vertices = geometry.vertices;
	colors = geometry.colors;

	console.log( newEdges );
	console.log( edits );



	for ( i = 0; i < newEdges.length; i++ ) {

		const edge = newEdges[ i ];

		vertices.push( edge.s1.p );
		vertices.push( edge.s2.p );
		colors.push( yellow, yellow );

	}

	this.geometry = geometry;
	this.needsUpdate = true;

	geometry.colorsNeedUpdate = true;

};

export { Beckeriser };

