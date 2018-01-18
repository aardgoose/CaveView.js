
import { ShaderMaterial } from '../../../../three.js/src/Three';
import { Shaders } from '../shaders/Shaders';
import { AtlasFactory } from '../materials/GlyphAtlas';

function GlyphMaterial ( glyphAtlasSpec, container, rotation ) {

	const glyphAtlas = AtlasFactory.getAtlas( glyphAtlasSpec );

	const cellScale = glyphAtlas.getCellScale();

	const cos = Math.cos( rotation );
	const sin = Math.sin( rotation );

	const rotationMatrix = new Float32Array( [ cos, sin, -sin, cos ] );

	ShaderMaterial.call( this, {
		uniforms: {
			cellScale: { value: cellScale },
			atlas: { value: glyphAtlas.getTexture() },
			rotate: { value: rotationMatrix },
			scale: { value: container.clientHeight / container.clientWidth }
		},
		vertexShader: Shaders.glyphVertexShader,
		fragmentShader: Shaders.glyphFragmentShader,
	} );

	this.opacity = 1.0;
	this.alphaTest = 0.8;
	this.depthTest = false;
	this.transparent = true;

	this.type = 'CV.GlyphMaterial';
	this.atlas = glyphAtlas;


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

GlyphMaterial.prototype.getAtlas = function () {

	return this.atlas;

};

export { GlyphMaterial };

// EOF