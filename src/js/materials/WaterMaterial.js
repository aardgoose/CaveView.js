import { ShaderMaterial, DoubleSide } from '../Three';
import { Shaders } from './shaders/Shaders';

class WaterMaterial extends ShaderMaterial {

	constructor () {

		super( {
			vertexShader: Shaders.waterVertexShader,
			fragmentShader: Shaders.waterFragmentShader,
			depthWrite: false,
			type: 'CV.WaterMaterial',
			uniforms: {
				offset: { value: 0 }
			},
			side: DoubleSide
		} );

	}

}

export { WaterMaterial };