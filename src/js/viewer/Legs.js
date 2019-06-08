import {
	BufferGeometry,
	VertexColors, LineSegments,
	LineBasicMaterial,
	Float32BufferAttribute
} from '../Three';

import { Cfg } from '../core/lib';
import { StencilLib } from '../core/StencilLib';

const unselectedMaterial = new LineBasicMaterial( { color: 0x444444, vertexColors: VertexColors } );

function Legs () {

	const geometry = new BufferGeometry();

	LineSegments.call( this, geometry, unselectedMaterial );

	this.type = 'Legs';
	this.legLengths = [];

	return this;

}

Legs.prototype = Object.create( LineSegments.prototype );

Legs.prototype.onBeforeRender = StencilLib.featureOnBeforeRender;
Legs.prototype.onAfterRender = StencilLib.featureOnAfterRender;

Legs.prototype.addLegs = function ( vertices, legRuns ) {

	const geometry = this.geometry;

	this.legVertices = vertices;
	this.legRuns = legRuns;

	var positions = new Float32BufferAttribute( vertices.length * 3, 3 );
	var colors = new Float32BufferAttribute( vertices.length * 3, 3 );

	geometry.addAttribute( 'position', positions.copyVector3sArray( vertices ) );
	geometry.addAttribute( 'color', colors );

	geometry.computeBoundingBox();

	this.computeStats();

	return this;

};

Legs.prototype.cutRuns = function ( selectedRuns ) {

	const legRuns = this.legRuns;

	if ( ! legRuns ) return;

	const geometry = this.geometry;
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

		if ( selectedRuns.has( survey ) ) {

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

	this.geometry = new BufferGeometry();
	this.geometry.name = geometry.name;

	geometry.dispose();

	this.addLegs( newVertices, newLegRuns );

	return true;

};


Legs.prototype.computeStats = function () {

	const stats = { maxLegLength: -Infinity, minLegLength: Infinity, legCount: 0, legLength: 0 };
	const vertices = this.legVertices;
	const l = vertices.length;

	const legLengths = new Array( l / 2 );

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

	const legRuns = this.legRuns;
	const unselectedColor = Cfg.themeColor( 'shading.unselected' );

	var l, run, v;

	const vertices = this.legVertices;

	const colorsAttribute = this.geometry.getAttribute( 'color' );
	const colors = colorsAttribute.array;

	if ( selectedRuns.size && legRuns ) {

		for ( run = 0, l = legRuns.length; run < l; run++ ) {

			const legRun = legRuns[ run ];

			const survey = legRun.survey;
			const start  = legRun.start;
			const end    = legRun.end;

			if ( selectedRuns.has( survey ) ) {

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

	// update bufferGeometry
	colorsAttribute.needsUpdate = true;


};

export { Legs };
