import {
	Geometry,
	VertexColors, LineSegments,
	LineBasicMaterial
} from '../../../../three.js/src/Three';

import { ColourCache } from '../core/ColourCache';

var unselectedMaterial = new LineBasicMaterial( { color: 0x444444, vertexColors: VertexColors } );

function Legs ( layer ) {

	var geometry = new Geometry();

	LineSegments.call( this, geometry, unselectedMaterial );

	this.layers.set( layer );
	this.type = 'Legs';

	return this;

}

Legs.prototype = Object.create( LineSegments.prototype );

Legs.prototype.constructor = Legs;

Legs.prototype.addLegs = function ( vertices, colors, legRuns ) {

	var geometry = this.geometry;

	if ( geometry.vertices.length === 0 ) {

		geometry.vertices = vertices;
		geometry.colors = colors;

	} else {

		// FIXME: alllocate new buffer of old + new length, adjust indexs and append old data after new data.

		console.error( 'Walls: appending not yet implemented' );

	}

	geometry.computeBoundingBox();

	this.legRuns = legRuns;

	this.computeStats();

	return this;

};

Legs.prototype.cutRuns = function ( selectedRuns ) {

	var legRuns = this.legRuns;

	if ( ! legRuns ) return;

	var geometry = this.geometry;

	var vertices = geometry.vertices;
	var colors   = geometry.colors;

	var newGeometry = new Geometry();

	var newVertices = newGeometry.vertices;
	var newColors   = newGeometry.colors;
	var newLegRuns  = [];

	var vp = 0;

	for ( var run = 0, l = legRuns.length; run < l; run++ ) {

		var legRun = legRuns[ run ];

		var survey = legRun.survey;
		var start  = legRun.start;
		var end    = legRun.end;

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

	var stats = { maxLegLength: -Infinity, minLegLength: Infinity, legCount: 0, legLength: 0 };
	var vertices = this.geometry.vertices;

	var vertex1, vertex2, legLength;

	var l = vertices.length;

	for ( var i = 0; i < l; i += 2 ) {

		vertex1 = vertices[ i ];
		vertex2 = vertices[ i + 1 ];

		legLength = Math.abs( vertex1.distanceTo( vertex2 ) );

		stats.legLength = stats.legLength + legLength;

		stats.maxLegLength = Math.max( stats.maxLegLength, legLength );
		stats.minLegLength = Math.min( stats.minLegLength, legLength );

	}

	stats.legLengthRange = stats.maxLegLength - stats.minLegLength;
	stats.legCount = l / 2;

	this.stats = stats;

};

Legs.prototype.setShading = function ( selectedRuns, colourSegment, material ) {

	this.material = material;

	var geometry = this.geometry;
	var legRuns = this.legRuns;

	var colors = geometry.colors;

	var l, run, v;

	if ( selectedRuns.size && legRuns ) {

		for ( run = 0, l = legRuns.length; run < l; run++ ) {

			var legRun = legRuns[ run ];

			var survey = legRun.survey;
			var start  = legRun.start;
			var end    = legRun.end;
 
			if ( selectedRuns.has( survey ) ) {

				for ( v = start; v < end; v += 2 ) {

					colourSegment( geometry, v, v + 1, survey );

				}

			} else {

				for ( v = start; v < end; v += 2 ) {

					colors[ v ]     = ColourCache.grey;
					colors[ v + 1 ] = ColourCache.grey;

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
