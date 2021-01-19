import { BufferGeometry, LineSegments, Float32BufferAttribute, Group } from '../Three';
import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { LineSegments2 } from '../core/LineSegments2';

const LINES_THIN = 1;
const LINES_FAT = 2;

function Legs ( ctx ) {

	Group.call( this );

	this.legs1 = null;
	this.legs2 = null;
	this.ctx = ctx;
	this.legLengths = [];
	this.legVertices = [];
	this.type = 'Legs';
	this.type = LINES_FAT;
	this.colors = [];

	return this;

}

Legs.prototype = Object.create( Group.prototype );

Legs.prototype.addLegs = function ( vertices, legRuns ) {

	const ctx = this.ctx;

	this.legVertices = vertices;
	this.legRuns = legRuns;

	var legs = null;

	if ( this.type == LINES_THIN ) {

		legs = new ThinLegs( ctx );

	} else {

		legs = new FatLegs( ctx );

	}

	const positions = new Float32BufferAttribute( vertices.length * 3, 3 );
	const colors = new Float32BufferAttribute( vertices.length * 3, 3 );

	positions.copyVector3sArray( vertices );
	colors.array.fill( 1.0 );

	legs.addLegs( positions, colors );

	legs.setShading = function () {};
	legs.layers = this.layers;

	this.computeStats();
	this.addStatic( legs );

	this.colors = colors;
	this.legs = legs;

	return this;

};

Legs.prototype.computeStats = function () {

	const stats = { maxLegLength: -Infinity, minLegLength: Infinity, legCount: 0, legLength: 0 };
	const vertices = this.legVertices;
	const l = vertices.length;

	const n = l / 2;
	const legLengths = new Array( n );

	var i, s1 = 0, s2 = 0;

	for ( i = 0; i < l; i += 2 ) {

		const vertex1 = vertices[ i ];
		const vertex2 = vertices[ i + 1 ];

		const legLength = vertex1.correctedDistanceTo( vertex2 );

		legLengths[ i / 2 ] = legLength; // cache lengths to avoid recalc

		s1 += legLength;
		s2 += legLength * legLength;

		stats.maxLegLength = Math.max( stats.maxLegLength, legLength );
		stats.minLegLength = Math.min( stats.minLegLength, legLength );

	}

	stats.legLength = s1;
	stats.legLengthSD = Math.sqrt( s2 / n - Math.pow( s1 / n, 2 ) );
	stats.legLengthRange = stats.maxLegLength - stats.minLegLength;
	stats.legCount = n;

	this.legLengths = legLengths;
	this.stats = stats;

	return this;

};

Legs.prototype.cutRuns = function ( selection ) {

	const idSet = selection.getIds();
	const legRuns = this.legRuns;

	if ( ! legRuns ) return;

	const vertices = this.legVertices;

	const newVertices = [];
	const newLegRuns = [];

	const l = legRuns.length;

	var run;

	for ( run = 0; run < l; run++ ) {

		const legRun = legRuns[ run ];

		const survey = legRun.survey;
		const start  = legRun.start;
		const end    = legRun.end;

		let vp = 0;

		if ( idSet.has( survey ) ) {

			for ( var v = start; v < end; v++ ) {

				newVertices.push( vertices[ v ] );

			}

			// adjust vertex run for new vertices and color arrays

			legRun.start = vp;

			vp += end - start;

			legRun.end = vp;

			newLegRuns.push( legRun );

		}

	}

	if ( newVertices.length === 0 ) return false;

	this.legs.geometry.dispose();
	this.remove( this.legs );

	this.addLegs( newVertices, newLegRuns );

	return true;

};

Legs.prototype.setShading = function ( idSet, colourSegment, material ) {

	let mode = 'basic';

	switch ( material.type ) {

	case 'CV.HeightMaterial':

		mode = 'height';
		break;

	case 'CV.DepthMaterial':

		mode = 'depth';
		break;

	case 'CV.DepthCursorMaterial':

		mode = 'depth-cursor';
		break;

	case 'CV.CursorMaterial':

		mode = 'cursor';
		break;

	}

	this.legs.material = this.ctx.materials.getLine2Material( mode );

	const legRuns = this.legRuns;
	const unselectedColor = this.ctx.cfg.themeColor( 'shading.unselected' );

	var l, run, v;

	const vertices = this.legVertices;
	const colors = this.colors.array;

	if ( idSet.size > 0 && legRuns ) {

		for ( run = 0, l = legRuns.length; run < l; run++ ) {

			const legRun = legRuns[ run ];

			const survey = legRun.survey;
			const start  = legRun.start;
			const end    = legRun.end;

			if ( idSet.has( survey ) ) {

				for ( v = start; v < end; v += 2 ) {

					colourSegment( vertices, colors, v, v + 1, survey );

				}

			} else {

				for ( v = start; v < end; v += 2 ) {

					unselectedColor.toArray( colors, v * 3 );
					unselectedColor.toArray( colors, ( v + 1 ) * 3 );

				}

			}

		}

	} else {

		for ( v = 0, l = vertices.length; v < l; v += 2 ) {

			colourSegment( vertices, colors, v, v + 1, null );

		}

	}

	this.legs.updateColors();

};

function ThinLegs ( ctx ) {

	const geometry = new BufferGeometry();

	LineSegments.call( this, geometry, ctx.materials.getUnselectedMaterial() );

	this.type = 'CV.ThinLegs';

	return this;

}

ThinLegs.prototype = Object.create( LineSegments.prototype );

ThinLegs.prototype.addLegs = function ( positions, colors ) {

	const geometry = this.geometry;

	geometry.setAttribute( 'position', positions );
	geometry.setAttribute( 'color', colors );

	geometry.computeBoundingBox();

	return this;

};

ThinLegs.prototype.updateColors = function () {

	this.geometry.getAttribute( 'color' ).needsUpdate = true;

};

function FatLegs ( ctx ) {

	const geometry = new LineSegmentsGeometry();

	LineSegments2.call( this, geometry, ctx.materials.getUnselectedMaterial() );

	this.type = 'CV.FatLegs';
	this.scale.set( 1, 1, 1 );

	return this;

}

FatLegs.prototype = Object.create( LineSegments2.prototype );

FatLegs.prototype.addLegs = function ( positions, colors ) {

	const geometry = this.geometry;

	geometry.setPositions( positions.array );
	geometry.setColors( colors.array );

	return this;

};

FatLegs.prototype.updateColors = function () {

	this.geometry.getAttribute( 'instanceColorStart' ).needsUpdate = true;
	this.geometry.getAttribute( 'instanceColorEnd' ).needsUpdate = true;

};

export { Legs };