
import { Shaders } from '../shaders/Shaders.js';
import { ShaderMaterial, DoubleSide } from '../../../../three.js/src/Three.js';

function WaterMaterial () {

	ShaderMaterial.call( this, {
		uniforms: {
			offset: { value: 0 }
		},
		vertexShader:    Shaders.waterVertexShader,
		fragmentShader:  Shaders.waterFragmentShader,
		depthWrite:      false,
		type:            "CV.WaterMaterial",
		side: DoubleSide
	} );

	return this;

}

WaterMaterial.prototype = Object.create( ShaderMaterial.prototype );

WaterMaterial.prototype.constructor = WaterMaterial;

export { WaterMaterial };

// EOF