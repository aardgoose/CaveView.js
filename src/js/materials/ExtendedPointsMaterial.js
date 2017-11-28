
import { VertexColors, ShaderMaterial, TextureLoader, Vector4, Matrix3 } from '../../../../three.js/src/Three';
import { Shaders } from '../shaders/Shaders';
import { getEnvironmentValue } from '../core/lib';
import { ColourCache } from '../core/ColourCache';

function ExtendedPointsMaterial () {

	ShaderMaterial.call( this, {
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
		vertexShader: Shaders.extendedPointsVertexShader,
		fragmentShader: Shaders.extendedPointsFragmentShader,
		vertexColors: VertexColors
	} );

	this.map = new TextureLoader().load( getEnvironmentValue( 'home', '' ) + 'images/disc.png' );

	this.color = ColourCache.white;
	this.opacity = 1.0;
	this.alphaTest = 0.8;

	this.size = 1;
	this.scale = 1;
	this.sizeAttenuation = true;
	this.transparent = true;

	this.type = 'CV.ExtendedPointsMaterial';

	this.isPointsMaterial = true;

	return this;

}

ExtendedPointsMaterial.prototype = Object.create( ShaderMaterial.prototype );

ExtendedPointsMaterial.prototype.constructor = ExtendedPointsMaterial;

export { ExtendedPointsMaterial };

// EOF