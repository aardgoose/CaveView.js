import { BufferGeometry, LineSegments, Float32BufferAttribute, Group } from '../Three';
import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { LineSegments2 } from '../core/LineSegments2';
import { MATERIAL_LINE, STATION_XSECT } from '../core/constants';

class Legs extends Group {

	constructor ( ctx ) {

		super();

		this.ctx = ctx;
		this.legLengths = [];
		this.legVertices = [];
		this.colors = [];
		this.type = 'Legs';

	}

}

Legs.prototype.addLegs = function ( vertices, legRuns ) {

	const ctx = this.ctx;

	this.legVertices = vertices;
	this.legRuns = legRuns;

	var legs = null;

	if ( ctx.cfg.value( 'gl-lines', false ) ) {

		legs = new ThinLegs( ctx );

	} else {

		legs = new FatLegs( ctx );

	}

	// these buffers have the same layout independant of the rendering material
	// standard gl_LINES or fat lines.

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

Legs.prototype.setShading = function ( idSet, colourSegment, mode, dashed ) {

	this.legs.updateMaterial( this.ctx, mode, dashed );

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

Legs.prototype.hide = function ( mode ) {

	this.legs.hide( this, mode );

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

ThinLegs.prototype.updateMaterial = function ( ctx, mode /*, dashed */ ) {

	const materials = ctx.materials;

	switch ( mode ) {

	case 'height':
		this.material = materials.getHeightMaterial( MATERIAL_LINE );
		break;

	case 'depth':
		this.material = materials.getDepthMaterial( MATERIAL_LINE );
		break;

	case 'depth-cursor':
		this.material = materials.getDepthCursorMaterial( MATERIAL_LINE );
		break;

	case 'cursor':
		this.material = materials.getCursorMaterial( MATERIAL_LINE );
		break;

	case 'basic':
		this.material = materials.getLineMaterial();
		break;

	}

	this.material.needsUpdate = true;

};

ThinLegs.prototype.hide = function ( legs, mode ) {

	const geometry = this.legs.geometry;

	geometry.clearGroups();

	if ( mode ) {

		const stations = legs.ctx.survey.stations;
		const vertices = legs.legVertices;

		const sType1 = stations.getStation( vertices[ 0 ] ).type;
		const sType2 = stations.getStation( vertices[ 0 ] ).type;

		let inWalls = ( !! ( sType1 & STATION_XSECT ) && !! ( sType2 & STATION_XSECT ) );

		const l = vertices.length;

		let start = 0;
		let count = 0;

		for ( let i = 0; i < l; i = i + 2 ) {

			const sType1 = stations.getStation( vertices[ i ] ).type;
			const sType2 = stations.getStation( vertices[ i + 1 ] ).type;

			const newInWalls = ( !! ( sType1 & STATION_XSECT ) && !! ( sType2 & STATION_XSECT ) );

			if ( inWalls === newInWalls ) {

				count += 2;

			} else {

				geometry.addGroup( start, count, ( inWalls ? 0 : 1 ) );

				start = i;
				count = 0;

			}

			inWalls = newInWalls;

		}

		geometry.addGroup( start, count + 2, inWalls ? 0 : 1 );

		const hiddenMaterial = legs.ctx.materials.getMissingMaterial();
		hiddenMaterial.visible = false;

		this.material = [ hiddenMaterial, this.material  ];

	} else {

		this.material = this.material[ 1 ];

	}

};

function FatLegs ( ctx ) {

	const geometry = new LineSegmentsGeometry();

	LineSegments2.call( this, geometry, ctx.materials.getLine2Material( 'basic' ) );

	this.scale.set( 1, 1, 1 );
	this.type = 'CV.FatLegs';

	return this;

}

FatLegs.prototype = Object.create( LineSegments2.prototype );

FatLegs.prototype.addLegs = function ( positions, colors ) {

	const geometry = this.geometry;

	geometry.setPositions( positions.array );
	geometry.setColors( colors.array );

	this.computeLineDistances();

	return this;

};

FatLegs.prototype.updateColors = function () {

	this.geometry.getAttribute( 'instanceColorStart' ).needsUpdate = true;
	this.geometry.getAttribute( 'instanceColorEnd' ).needsUpdate = true;

};

FatLegs.prototype.updateMaterial = function ( ctx, mode, dashed ) {

	this.material = ctx.materials.getLine2Material( mode, dashed );
	this.material.needsUpdate = true;

};

FatLegs.prototype.hide = function ( legs, mode ) {

	if ( mode ) {

		const stations = legs.ctx.survey.stations;
		const vertices = legs.legVertices;

		const l = vertices.length;

		const hide = [];

		for ( let i = 0; i < l; i = i + 2 ) {

			const sType1 = stations.getStation( vertices[ i ] ).type;
			const sType2 = stations.getStation( vertices[ i + 1 ] ).type;

			hide.push( sType1 & STATION_XSECT && sType2 & STATION_XSECT ? 1 : 0 );

		}

		this.geometry.setHide( hide );

	} else {

		this.geometry.clearHide();

	}

};

export { Legs };