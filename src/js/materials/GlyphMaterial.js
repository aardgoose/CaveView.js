import { Vector2, Vector3 } from '../Three';
import { attribute, property, modelViewProjection, ShaderNode, trunc, texture, NodeMaterial, uniform, varying, vec2, vec4, positionGeometry, modelViewMatrix } from '../Nodes';
import { GlyphAtlasCache } from '../materials/GlyphAtlasCache';

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
			alphaTest: 0.8,
			color: 0xffffff,
			depthTest: false,
			transparent: true,
		} );

		this.name = `CV:GlyphMaterial:${type}`;
		this.normals = false;
		this.lights = false;

		// glyph shader, each instance represents one glyph.

		const cellScale = uniform( glyphAtlas.cellScale );
		const scale = uniform( new Vector2( realPixels, realPixels ).divide( viewPortV ), 'vec2' );
		// const rotate = uniform( rotationMatrix, 'mat2' );
		const viewPort = uniform( viewPortV, 'vec2' );

		// attributes

		const offsets        = attribute( 'offsets' );
		const instanceOffset = attribute( 'instanceOffset' );
		const instanceUV     = attribute( 'instanceUV' );
		const instanceWidth  = attribute( 'instanceWidth' );

		const uv = varying( instanceUV.add( vec2( positionGeometry.x.mul( cellScale ).mul( instanceWidth ), positionGeometry.y.mul( cellScale ) ) ) );

		this.vertexNode = new ShaderNode( ( stack ) => {

			// scale by glyph width ( vertices form unit square with (0,0) origin )

			const newPosition = vec2( positionGeometry.x.mul( instanceWidth ), positionGeometry.y );

			// move to correct offset in string

			stack.assign( newPosition, newPosition.add( vec2( instanceOffset, offsets ) ) );

			// rotate as required

			// newPosition = rotate * newPosition; //FIXME

			// position of GlyphString object on screen

			const offset = property( 'vec4', 'offset' );

			stack.assign( offset, modelViewProjection( vec4( 0.0, 0.0, 0.0, 1.0 ) ) );

			// scale glyphs

			stack.assign( newPosition, newPosition.mul( scale ) );

			// move to clip space

			stack.assign( newPosition, newPosition.mul( offset.w ) );

			const mvPosition = modelViewMatrix.mul( vec4( positionGeometry, 1.0 ) );

			stack.assign( offset, offset.add( vec4( newPosition, 0, 0 ) ) );

			const snap = viewPort.div( offset.w );

			stack.assign( offset, vec4( trunc( offset.xy.mul( snap ) ).add( 0.5 ).div( snap ), offset.z, offset.w ) );

			return offset;

		} );

		//		this.rotation = rotationMatrix;

		// fragment shader

		this.colorNode = texture( glyphAtlas.getTexture(), uv );
		this.opacityNode = texture( glyphAtlas.getTexture(), uv ).a;

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
			self.scaleFactor = glyphAtlas.cellSize / pixelRatio;

		}

		this.rotateVector = function ( v ) {

			const x = v.x;
			const y = v.y;

			v.x = cosR * x - sinR * y;
			v.y = sinR * x + cosR * y;

		};

	}


	getCellSize () {

		return this.atlas.cellSize;

	}

	getAtlas () {

		return this.atlas;

	}

	customProgramCacheKey () {

		return this.name;

	}

}

export { GlyphMaterial };