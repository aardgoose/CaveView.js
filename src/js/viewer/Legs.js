import { Vector2, BufferGeometry, LineSegments, Float32BufferAttribute, Group, IncrementStencilOp } from '../Three';

import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { LineMaterial } from '../core/LineMaterial';
import { LineSegments2 } from '../core/LineSegments2';

function Legs ( ctx ) {

	Group.call( this );

	this.legs1 = null;
	this.legs2 = null;
	this.ctx = ctx;
	this.legLengths = [];
	this.legVertices = [];
	this.type = 'Legs';

	return this;

}

Legs.prototype = Object.create( Group.prototype );

Legs.prototype.addLegs = function ( vertices, legRuns ) {

	const ctx = this.ctx;

	this.legVertices = vertices;
	this.legRuns = legRuns;

	const legs1 = new Legs1( ctx );

	legs1.layers = this.layers;
	legs1.addLegs( vertices, legRuns );

	this.addStatic( legs1 );
	this.legs1 = legs1;

	const legs2Geometry = new LineSegmentsGeometry();

	legs2Geometry.setPositions( legs1.geometry.attributes.position.array );
	legs2Geometry.setColors( legs1.geometry.attributes.color.array );

	const legs2Material = new LineMaterial( {
		color: 0xffffff,
		vertexColors: true,
		linewidth: 1
	} );

	legs2Material.stencilWrite = true;
	legs2Material.stencilZPass = IncrementStencilOp;

	const legs2 = new LineSegments2( legs2Geometry, legs2Material );

	legs2Material.resolution = new Vector2( ctx.container.clientWidth, ctx.container.clientHeight );

	ctx.viewer.addEventListener( 'resized', ( e ) => {

		const lineScale = e.lineScale ? e.lineScale : 1;

		legs2Material.resolution = new Vector2( e.width, e.height );
		legs2Material.linewidth = Math.max( 1, Math.floor( e.width / 1000 ) * lineScale );

	} );

	legs2.setShading = function () {};
	legs2.scale.set( 1, 1, 1 );
	legs2.layers = this.layers;
	legs2.type = 'CV.Legs2';

	this.addStatic( legs2 );
	this.legs2 = legs2;

	legs1.visible = false;

	this.computeStats();

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

	this.legs1.geometry.dispose();
	this.remove( this.legs1 );

	this.legs2.geometry.dispose();
	this.remove( this.legs2 );

	this.legs1 = null;
	this.legs2 = null;

	this.addLegs( newVertices, newLegRuns );

	return true;

};

Legs.prototype.setShading = function ( idSet, colourSegment, material ) {

	this.legs1.material = material;

	const legRuns = this.legRuns;
	const unselectedColor = this.ctx.cfg.themeColor( 'shading.unselected' );

	var l, run, v;

	const vertices = this.legVertices;

	const colorsAttribute = this.legs1.geometry.getAttribute( 'color' );
	const colors = colorsAttribute.array;

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

	// update bufferGeometry
	colorsAttribute.needsUpdate = true;

	if ( this.legs2 !== null ) {

		this.legs2.geometry.getAttribute( 'instanceColorStart' ).needsUpdate = true;
		this.legs2.geometry.getAttribute( 'instanceColorEnd' ).needsUpdate = true;

	}

};

function Legs1 ( ctx ) {

	const geometry = new BufferGeometry();

	LineSegments.call( this, geometry, ctx.materials.getUnselectedMaterial() );

	this.type = 'CV.Legs1';

	return this;

}

Legs1.prototype = Object.create( LineSegments.prototype );

Legs1.prototype.addLegs = function ( vertices ) {

	const geometry = this.geometry;

	var positions = new Float32BufferAttribute( vertices.length * 3, 3 );
	var colors = new Float32BufferAttribute( vertices.length * 3, 3 );

	colors.array.fill( 1.0 );

	geometry.setAttribute( 'position', positions.copyVector3sArray( vertices ) );
	geometry.setAttribute( 'color', colors );

	geometry.computeBoundingBox();

	return this;

};

export { Legs };