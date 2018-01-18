import {
	Geometry,
	VertexColors, LineSegments,
	LineBasicMaterial
} from '../../../../three.js/src/Three';

import { ColourCache } from '../core/ColourCache';

const unselectedMaterial = new LineBasicMaterial( { color: 0x444444, vertexColors: VertexColors } );

function onBeforeRender( renderer ) {

	const stencil = renderer.state.buffers.stencil;
	const gl = renderer.context;

	stencil.setTest( true );

	stencil.setOp( gl.KEEP, gl.KEEP, gl.INCR );

}

function onAfterRender( renderer ) {

	const stencil = renderer.state.buffers.stencil;

	stencil.setTest( false );


}

function Legs ( layer ) {

	const geometry = new Geometry();

	LineSegments.call( this, geometry, unselectedMaterial );

	this.layers.set( layer );
	this.type = 'Legs';

	this.onBeforeRender = onBeforeRender;
	this.onAfterRender = onAfterRender;

	return this;

}

Legs.prototype = Object.create( LineSegments.prototype );

Legs.prototype.constructor = Legs;

Legs.prototype.addLegs = function ( vertices, colors, legRuns ) {

	const geometry = this.geometry;

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

	const legRuns = this.legRuns;

	if ( ! legRuns ) return;

	const geometry = this.geometry;

	const vertices = geometry.vertices;
	const colors   = geometry.colors;

	const newGeometry = new Geometry();

	const newVertices = newGeometry.vertices;
	const newColors   = newGeometry.colors;

	var newLegRuns  = [];

	var vp = 0;

	for ( var run = 0, l = legRuns.length; run < l; run++ ) {

		const legRun = legRuns[ run ];

		const survey = legRun.survey;
		const start  = legRun.start;
		const end    = legRun.end;

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

	var vertex1, vertex2, legLength;

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

	const geometry = this.geometry;
	const legRuns = this.legRuns;
	const colors = geometry.colors;

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
