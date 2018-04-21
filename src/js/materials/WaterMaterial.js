
import { Shaders } from '../shaders/Shaders';
import { ShaderMaterial, DoubleSide } from '../Three';

function WaterMaterial () {

	ShaderMaterial.call( this, {
		vertexShader: Shaders.waterVertexShader,
		fragmentShader: Shaders.waterFragmentShader,
		depthWrite: false,
		type: 'CV.WaterMaterial',
		uniforms: {
			offset: { value: 0 }
		},
		side: DoubleSide
	} );

	return this;

}

WaterMaterial.prototype = Object.create( ShaderMaterial.prototype );

export { WaterMaterial };

// EOF