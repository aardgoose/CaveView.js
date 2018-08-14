import {
	Geometry,
	VertexColors, LineSegments,
	LineBasicMaterial
} from '../Three';

import { Cfg } from '../core/lib';
import { StencilLib } from '../core/StencilLib';

const unselectedMaterial = new LineBasicMaterial( { color: 0x444444, vertexColors: VertexColors } );

function Legs () {

	const geometry = new Geometry();

	LineSegments.call( this, geometry, unselectedMaterial );

	this.type = 'Legs';
	this.legLengths = [];

	return this;

}

Legs.prototype = Object.create( LineSegments.prototype );

Legs.prototype.onBeforeRender = StencilLib.featureOnBeforeRender;
Legs.prototype.onAfterRender = StencilLib.featureOnAfterRender;

Legs.prototype.addLegs = function ( vertices, colors, legRuns ) {

	const geometry = this.geometry;

	if ( geometry.vertices.length === 0 ) {

		geometry.vertices = vertices;
		geometry.colors = colors;

	} else {

		// FIXME: alllocate new buffer of old + new length, adjust indexs and append old data after new data.

		console.error( 'Legs: appending not yet implemented' );

	}

	geometry.computeBoundingBox();

	this.legRuns = legRuns;

	this.computeStats();

	return this;

};

Legs.prototype.cutRuns = function ( selectedRuns ) {

	const legRuns = this.legRuns;

	if ( ! legRuns ) return;

	const geometry = this.geometry;

	const vertices = geometry.vertices;
	const colors   = geometry.colors;

	const newGeometry = new Geometry();

	const newVertices = newGeometry.vertices;
	const newColors   = newGeometry.colors;

	const newLegRuns = [];
	const l = legRuns.length;

	var run;

	for ( run = 0; run < l; run++ ) {

		const legRun = legRuns[ run ];

		const survey = legRun.survey;
		const start  = legRun.start;
		const end    = legRun.end;

		let vp = 0;

		if ( selectedRuns.has( survey ) ) {

			for ( var v = start; v < end; v++ ) {

				newVertices.push( vertices[ v ] );
				newColors.push( colors[ v ] );

			}

			// adjust vertex run for new vertices and color arrays

			legRun.start = vp;

			vp += end - start;

			legRun.end = vp;

			newLegRuns.push( legRun );

		}

	}

	if ( newGeometry.vertices.length === 0 ) return false;

	newGeometry.computeBoundingBox();
	newGeometry.name = geometry.name;

	this.geometry = newGeometry;
	this.legRuns = newLegRuns;

	geometry.dispose();

	this.computeStats();

	return true;

};

Legs.prototype.computeStats = function () {

	const stats = { maxLegLength: -Infinity, minLegLength: Infinity, legCount: 0, legLength: 0 };
	const vertices = this.geometry.vertices;
	const l = vertices.length;

	const legLengths = [];

	var i;

	for ( i = 0; i < l; i += 2 ) {

		const vertex1 = vertices[ i ];
		const vertex2 = vertices[ i + 1 ];

		const legLength = vertex1.correctedDistanceTo( vertex2 );

		legLengths[ i / 2 ] = legLength; // cache lengths to avoid recalc

		stats.legLength = stats.legLength + legLength;

		stats.maxLegLength = Math.max( stats.maxLegLength, legLength );
		stats.minLegLength = Math.min( stats.minLegLength, legLength );

	}

	this.legLengths = legLengths;

	stats.legLengthRange = stats.maxLegLength - stats.minLegLength;
	stats.legCount = l / 2;

	this.stats = stats;

};

Legs.prototype.setShading = function ( selectedRuns, colourSegment, material ) {

	this.material = material;

	const geometry = this.geometry;
	const legRuns = this.legRuns;
	const colors = geometry.colors;
	const unselectedColor = Cfg.themeColor( 'shading.unselected' );

	var l, run, v;

	if ( selectedRuns.size && legRuns ) {

		for ( run = 0, l = legRuns.length; run < l; run++ ) {

			const legRun = legRuns[ run ];

			const survey = legRun.survey;
			const start  = legRun.start;
			const end    = legRun.end;

			if ( selectedRuns.has( survey ) ) {

				for ( v = start; v < end; v += 2 ) {

					colourSegment( geometry, v, v + 1, survey );

				}

			} else {

				for ( v = start; v < end; v += 2 ) {

					colors[ v ]     = unselectedColor;
					colors[ v + 1 ] = unselectedColor;

				}

			}

		}

	} else {

		for ( v = 0, l = geometry.vertices.length; v < l; v += 2 ) {

			colourSegment( geometry, v, v + 1 );

		}

	}

	geometry.colorsNeedUpdate = true;

};

export { Legs };
