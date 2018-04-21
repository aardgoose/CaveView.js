
import { VertexColors, ShaderMaterial, TextureLoader, Vector4, Matrix3 } from '../Three';
import { Shaders } from '../shaders/Shaders';
import { Cfg } from '../core/lib';
import { ColourCache } from '../core/ColourCache';

function ExtendedPointsMaterial () {

	ShaderMaterial.call( this, {
		vertexShader: Shaders.extendedPointsVertexShader,
		fragmentShader: Shaders.extendedPointsFragmentShader,
		type: 'CV.ExtendedPointsMaterial',
		uniforms: {
			diffuse: { value: ColourCache.white },
			opacity: { value: 1.0 },
			size: { value: 1.0 },
			scale: { value: 1.0 },
			pScale: { value: 1.0 },
			offsetRepeat: { value: new Vector4() },
			map: { value: null },
			uvTransform: { value: new Matrix3() }
		},
		vertexColors: VertexColors
	} );

	this.map = new TextureLoader().load( Cfg.value( 'home', '' ) + 'images/disc.png' );

	this.color = ColourCache.white;
	this.opacity = 1.0;
	this.alphaTest = 0.8;

	this.size = 1;
	this.scale = 1;
	this.sizeAttenuation = true;
	this.transparent = true;

	this.isPointsMaterial = true;

	return this;

}

ExtendedPointsMaterial.prototype = Object.create( ShaderMaterial.prototype );

export { ExtendedPointsMaterial };

// EOF