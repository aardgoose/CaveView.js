import { Vector2, Vector3 } from '../Three';
import { attribute, modelViewProjection, shader, NodeMaterial, float, uniform, varying, vec2, vec4, texture, positionGeometry, modelViewMatrix } from '../Nodes';
import { GlyphAtlasCache } from '../materials/GlyphAtlasCache';

let id = 0;

class GlyphMaterial extends NodeMaterial {

	constructor ( type, ctx ) {

		const glyphAtlas = GlyphAtlasCache.getAtlas( type, ctx );

		const viewer = ctx.viewer;
		const rotation = ctx.cfg.themeAngle( `${type}.rotation` );
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
			alphaTest: 0.9,
			color: 0xffffff,
			depthTest: false,
			transparent: false,

		} );

		this.normals = false;
		this.lights = false;
//		this.isTest = true;

		// glyph shader, each instance represents one glyph.

		const cellScale = uniform( glyphAtlas.cellScale );
		const scale = uniform( new Vector2( realPixels, realPixels ).divide( viewPortV ), 'vec2' );
		// const rotate = uniform( rotationMatrix, 'mat2' );
		const viewPort = uniform( viewPortV, 'vec2' );

		// attributes

		const offsets        = attribute( 'offsets', 'float' );
		const instanceOffset = attribute( 'instanceOffset', 'float' );
		const instanceUV     = attribute( 'instanceUV', 'vec2' );
		const instanceWidth  = attribute( 'instanceWidth', 'float' );

		const uv = varying( instanceUV.add( vec2( positionGeometry.x.mul( cellScale ).mul( instanceWidth ), positionGeometry.y.mul( cellScale ) ) ) );

		const vertexShader = shader( ( stack ) => {

			// scale by glyph width ( vertices form unit square with (0,0) origin )

			const newPosition = vec2( positionGeometry.x.mul( instanceWidth ), positionGeometry.y );

			// move to correct offset in string

			stack.assign( newPosition, newPosition.add( vec2( instanceOffset, offsets ) ) );

			// rotate as required

			// newPosition = rotate * newPosition; //FIXME

			// position of GlyphString object on screen

			const offset = modelViewProjection( vec4( 0.0, 0.0, 0.0, 1.0 ) );

			// scale glyphs

			stack.assign( newPosition, newPosition.mul( scale ) );

			// move to clip space

			stack.assign( newPosition, newPosition.mul( offset.w ) );

			const mvPosition = modelViewMatrix.mul( vec4( positionGeometry, 1.0 ) );

			this.outputNode = vec4( newPosition, 0.0, 0.0 ).add( offset );

			/*
			vec2 snap = viewPort / gl_Position.w;

			gl_Position.xy =  ( trunc( gl_Position.xy * snap ) + 0.5 ) / snap; // FIXME
			*/

			return this.outputNode;

		} );

		//		this.rotation = rotationMatrix;

		this.outNode = vertexShader;

		// fragment shader

		this.colorNode = texture( glyphAtlas.getTexture(), uv );

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

		return this.outNode;

	}

	getCellSize () {

		return this.atlas.cellSize;

	}

	getAtlas () {

		return this.atlas;

	}

	customProgramCacheKey () {

		return `glyph${id++}`;

	}

}

export { GlyphMaterial };