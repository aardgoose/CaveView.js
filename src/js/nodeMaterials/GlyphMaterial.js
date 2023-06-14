import { Vector2, Vector3 } from '../Three';
import { attribute, color, modelViewProjection, NodeMaterial, float, uniform, varying, vec2, vec4, texture, positionGeometry, modelViewMatrix } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class GlyphMaterial extends NodeMaterial {

	constructor ( ctx, glyphAtlas, rotation, viewer ) {

		const container = viewer.container;
		const realPixels = glyphAtlas.cellSize * 2;
		const pixelRatio = window.devicePixelRatio || 1;

		const cos = Math.cos( -rotation );
		const sin = Math.sin( -rotation );

		const cosR = Math.cos( rotation );
		const sinR = Math.sin( rotation );

		const viewPortV = new Vector2( Math.floor( pixelRatio * container.clientWidth ) / 2, Math.floor( pixelRatio * container.clientHeight ) / 2 );

		const rotationMatrix = new Float32Array( [ cos, -sin, sin, cos ] ); // FIXME

		super( {
//			color: 0xffffff,
//			depthTest: false,
//			transparent: false,
		} );

		this.normals = false;

		// glyph shader, each instance represents one glyph.

		// uniforms

		const cellScale = uniform( glyphAtlas.cellScale );
		const atlas = uniform( glyphAtlas.getTexture() );
		// const rotate = uniform( rotationMatrix, 'mat2' );
		const scale = uniform( new Vector2( realPixels, realPixels ).divide( viewPortV ), 'vec2' );
//		const viewPort = uniform( viewPortV, 'vec2' );

		// attributes

		const offsets        = attribute( 'offsets', float );

		const instanceUV     = attribute( 'instanceUV', 'vec2' );
		const instanceOffset = attribute( 'instanceOffset', 'float' );
		const instanceWidth  = attribute( 'instanceWidth', 'float' );

		// vertex shader

		const uv = varying( instanceUV.add( vec2(  positionGeometry.x.mul( cellScale ).mul( instanceWidth ), positionGeometry.y.mul( cellScale ) ) ) );

		// scale by glyph width ( vertices form unit square with (0,0) origin )

		let newPosition = vec2( positionGeometry.x.mul( instanceWidth ), positionGeometry.y );

		// move to correct offset in string
		newPosition = newPosition.add( vec2( instanceOffset, offsets ) )

		// rotate as required

		//newPosition = rotate * newPosition; //FIXME

		// position of GlyphString object on screen

		const offset = modelViewProjection( vec4( 0.0, 0.0, 0.0, 1.0 ) );

		// scale glyphs
		newPosition = newPosition.mul( scale );

		// move to clip space

		newPosition = newPosition.mul( offset.w );

//		const mvPosition = modelViewMatrix.mul( vec4( positionGeometry, 1.0 ) );

		this.outputNode = vec4( newPosition, 0.0, 0.0 ).add( offset );

		/*
		vec2 snap = viewPort / gl_Position.w;

		gl_Position.xy =  ( trunc( gl_Position.xy * snap ) + 0.5 ) / snap;
		*/

		//		this.rotation = rotationMatrix;

		// fragment shader

		this.colorNode = texture( glyphAtlas.getTexture(), uv );
//		this.colorNode = color( 0xff00ff );

		// end of shader

		this.type = 'CV:GlyphMaterial';
		this.atlas = glyphAtlas;
		this.scaleFactor = glyphAtlas.cellSize / pixelRatio;
		this.toScreenSpace = new Vector3( container.clientWidth/ 2, container.clientHeight / 2, 1 );


		this.scale = scale;

		viewer.addEventListener( 'resized', _resize );

		const self = this;

		function _resize () {

			self.scale.value.set( realPixels / Math.floor( pixelRatio * container.clientWidth ), realPixels/ Math.floor( pixelRatio * container.clientHeight ) );
			self.toScreenSpace.set( container.clientWidth/ 2, container.clientHeight / 2, 1 );
			this.scaleFactor = glyphAtlas.cellSize / pixelRatio;

		}

		this.rotateVector = function ( v ) {

			const x = v.x;
			const y = v.y;

			v.x = cosR * x - sinR * y;
			v.y = sinR * x + cosR * y;

		};

	}

	constructPosition( /* builder */ ) {
console.warn( 'vvvvvvv' );
		return this.outputNode;

	}

	getCellSize () {

		return this.atlas.cellSize;

	}

	getAtlas () {

		return this.atlas;

	}

	customProgramCacheKey () {

		return 'glyph';

	}

}

export { GlyphMaterial };

/*

varying vec2 vUv;

void main() {

	// select glyph from atlas ( with proportional spacing ).

	vUv = instanceUvs + vec2( position.x * cellScale * instanceWidths, position.y * cellScale );

	// scale by glyph width ( vertices form unit square with (0,0) origin )

	vec2 newPosition = vec2( position.x * instanceWidths, position.y );

	// move to correct offset in string

	newPosition.x += instanceOffsets;
	newPosition.y += offsets;

	// rotate as required

	newPosition = rotate * newPosition;

	// position of GlyphString object on screen

	vec4 offset = projectionMatrix * modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );

	// scale glyphs
	newPosition *= scale;

	// move to clip space

	newPosition.xy *= offset.w;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	gl_Position = vec4( newPosition, 0.0, 0.0 ) + offset;

	vec2 snap = viewPort / gl_Position.w;

	gl_Position.xy =  ( trunc( gl_Position.xy * snap ) + 0.5 ) / snap;

}
*/