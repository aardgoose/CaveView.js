
import { ShaderMaterial, Vector2 } from '../Three';
import { Shaders } from '../shaders/Shaders';
import { AtlasFactory } from '../materials/GlyphAtlas';
import { MaterialFog } from './MaterialFog';

function GlyphMaterial ( glyphAtlasSpec, rotation, viewer ) {

	const self = this;

	const glyphAtlas = AtlasFactory.getAtlas( glyphAtlasSpec );
	const cellScale = glyphAtlas.getCellScale();
	const container = viewer.container;

	const cos = Math.cos( rotation );
	const sin = Math.sin( rotation );
	const scale = new Vector2( 32 / container.clientWidth, 32 / container.clientHeight );

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
		}, MaterialFog.uniforms ),
	} );

	this.alphaTest = 0.9;
	this.depthTest = false;
	this.transparent = true;

	this.type = 'CV.GlyphMaterial';
	this.atlas = glyphAtlas;
	this.scaleFactor = container.clientHeight * cellScale / 2;

	viewer.addEventListener( 'resized', _resize );

	return this;

	function _resize() {

		self.uniforms.scale.value.set( 32 / container.clientWidth, 32 / container.clientHeight );
		self.scaleFactor = container.clientHeight * self.atlas.getCellScale() / 2;

	}

}

GlyphMaterial.prototype = Object.create( ShaderMaterial.prototype );

GlyphMaterial.prototype.getAtlas = function () {

	return this.atlas;

};


export { GlyphMaterial };

// EOF