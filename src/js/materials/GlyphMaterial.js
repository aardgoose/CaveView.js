import { ShaderMaterial, Vector2 } from '../Three';
import { Shaders } from '../shaders/Shaders';

class GlyphMaterial extends ShaderMaterial {

	constructor ( ctx, glyphAtlas, rotation, viewer ) {

		const cellScale = glyphAtlas.cellScale;
		const container = viewer.container;
		const realPixels = glyphAtlas.cellSize;

		const cos = Math.cos( rotation );
		const sin = Math.sin( rotation );
		const scale = new Vector2( realPixels / container.clientWidth, realPixels / container.clientHeight );

		const rotationMatrix = new Float32Array( [ cos, sin, -sin, cos ] );

		super( {
			vertexShader: Shaders.glyphVertexShader,
			fragmentShader: Shaders.glyphFragmentShader,
			type: 'CV.GlyphMaterial',
			uniforms: Object.assign( {
				cellScale: { value: cellScale },
				atlas: { value: glyphAtlas.getTexture() },
				rotate: { value: rotationMatrix },
				scale: { value: scale }
			}, ctx.materials.commonUniforms ),
		} );

		this.rotation = rotation;
		this.alphaTest = 0.9;
		this.depthTest = false;
		this.transparent = true;

		this.type = 'CV.GlyphMaterial';
		this.atlas = glyphAtlas;
		this.scaleFactor = 1 / glyphAtlas.cellScale;

		viewer.addEventListener( 'resized', _resize );

		const self = this;


		function _resize() {

			self.uniforms.scale.value.set( realPixels / container.clientWidth, realPixels / container.clientHeight );

		}

	}

}

GlyphMaterial.prototype.getAtlas = function () {

	return this.atlas;

};

export { GlyphMaterial };