import { ShaderMaterial, Vector2, Vector3 } from '../Three';
import { Shaders } from './shaders/Shaders';

class GlyphMaterial extends ShaderMaterial {

	constructor ( ctx, glyphAtlas, rotation, viewer ) {

		const uniforms = ctx.materials.uniforms;
		const cellScale = glyphAtlas.cellScale;
		const container = viewer.container;
		const realPixels = glyphAtlas.cellSize * 2;
		const pixelRatio = window.devicePixelRatio || 1;

		const cos = Math.cos( -rotation );
		const sin = Math.sin( -rotation );

		const cosR = Math.cos( rotation );
		const sinR = Math.sin( rotation );

		const scale = new Vector2( realPixels / Math.floor( pixelRatio * container.clientWidth), realPixels / Math.floor( pixelRatio * container.clientHeight ) );

		const rotationMatrix = new Float32Array( [ cos, -sin, sin, cos ] );

		super( {
			vertexShader: Shaders.glyphVertexShader,
			fragmentShader: Shaders.glyphFragmentShader,
			type: 'CV.GlyphMaterial',
			uniforms: Object.assign( {
				cellScale: { value: cellScale },
				atlas: { value: glyphAtlas.getTexture() },
				rotate: { value: rotationMatrix },
				scale: { value: scale }
			}, uniforms.common ),
		} );

		this.rotation = rotation;
		this.alphaTest = 0.9;
		this.depthTest = false;
		this.transparent = true;

		this.type = 'CV.GlyphMaterial';
		this.atlas = glyphAtlas;
		this.scaleFactor = glyphAtlas.cellSize / pixelRatio;
		this.toScreenSpace = new Vector3( container.clientWidth/ 2, container.clientHeight / 2, 1 );

		viewer.addEventListener( 'resized', _resize );

		const self = this;

		function _resize () {

			self.uniforms.scale.value.set( realPixels / Math.floor( pixelRatio * container.clientWidth ), realPixels/ Math.floor( pixelRatio * container.clientHeight ) );
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

	getCellSize () {

		return this.atlas.cellSize;

	}

	getAtlas () {

		return this.atlas;

	}

}

export { GlyphMaterial };