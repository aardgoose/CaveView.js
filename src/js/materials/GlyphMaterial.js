
import { ShaderMaterial } from '../../../../three.js/src/Three';
import { Shaders } from '../shaders/Shaders';

function GlyphMaterial ( glyphAtlasTexture, cellScale ) {

	ShaderMaterial.call( this, {
		uniforms: {
			cellScale: { value: cellScale },
			atlas: { value: glyphAtlasTexture }
		},
		vertexShader: Shaders.glyphVertexShader,
		fragmentShader: Shaders.glyphFragmentShader,
	} );

	this.opacity = 1.0;
	this.alphaTest = 0.8;
	this.transparent = true;

	this.type = 'CV.GlyphMaterial';

	return this;

}

GlyphMaterial.prototype = Object.create( ShaderMaterial.prototype );

GlyphMaterial.prototype.constructor = GlyphMaterial;

export { GlyphMaterial };

// EOF