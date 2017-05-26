
import { ShaderMaterial, Matrix4 } from '../../../../three.js/src/Three';
import { Shaders } from '../shaders/Shaders';

function GlyphMaterial ( glyphAtlasTexture, cellScale, container, rotation ) {

	console.log( container );

	ShaderMaterial.call( this, {
		uniforms: {
			cellScale: { value: cellScale },
			atlas: { value: glyphAtlasTexture },
			rotate: { value: new Matrix4().makeRotationZ( rotation ) },
			scale: { value: container.clientHeight / container.clientWidth }
		},
		vertexShader: Shaders.glyphVertexShader,
		fragmentShader: Shaders.glyphFragmentShader,
	} );

	this.opacity = 1.0;
	this.alphaTest = 0.8;
	this.transparent = true;
	this.defines = { USE_COLOR: true };

	this.defaultAttributeValues.color = [ 1, 1, 0 ];
	this.type = 'CV.GlyphMaterial';


	// event handler
	window.addEventListener( 'resize', _resize );

	var self = this;

	return this;

	function _resize() {

		self.uniforms.scale.value = container.clientHeight / container.clientWidth;

	}

}

GlyphMaterial.prototype = Object.create( ShaderMaterial.prototype );

GlyphMaterial.prototype.constructor = GlyphMaterial;

export { GlyphMaterial };

// EOF