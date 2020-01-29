
import { ShaderMaterial, Vector2 } from '../Three';
import { Shaders } from '../shaders/Shaders';
import { AtlasFactory } from '../materials/GlyphAtlas';
import { MaterialCommon } from './MaterialCommon';

function GlyphMaterial ( glyphAtlasSpec, rotation, viewer ) {

	this.rotation = rotation;

	const self = this;

	const glyphAtlas = AtlasFactory.getAtlas( glyphAtlasSpec );
	const cellScale = glyphAtlas.cellScale;
	const container = viewer.container;
	const realPixels = glyphAtlas.cellSize;

	const cos = Math.cos( rotation );
	const sin = Math.sin( rotation );
	const scale = new Vector2( realPixels / container.clientWidth, realPixels / container.clientHeight );

	const rotationMatrix = new Float32Array( [ cos, sin, -sin, cos ] );

	ShaderMaterial.call( this, {
		vertexShader: Shaders.glyphVertexShader,
		fragmentShader: Shaders.glyphFragmentShader,
		type: 'CV.GlyphMaterial',
		uniforms: Object.assign( {
			cellScale: { value: cellScale },
			atlas: { value: glyphAtlas.getTexture() },
			rotate: { value: rotationMatrix },
			scale: { value: scale }
		}, MaterialCommon.uniforms ),
	} );

	this.alphaTest = 0.9;
	this.depthTest = false;
	this.transparent = true;

	this.type = 'CV.GlyphMaterial';
	this.atlas = glyphAtlas;
	this.scaleFactor = 1 / glyphAtlas.cellScale;

	viewer.addEventListener( 'resized', _resize );

	return this;

	function _resize() {

		self.uniforms.scale.value.set( realPixels / container.clientWidth, realPixels / container.clientHeight );

	}

}

GlyphMaterial.prototype = Object.create( ShaderMaterial.prototype );

GlyphMaterial.prototype.getAtlas = function () {

	return this.atlas;

};


export { GlyphMaterial };

// EOF