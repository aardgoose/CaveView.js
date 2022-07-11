import { ShaderMaterial } from '../Three';
import { Shaders } from './shaders/Shaders';

class DepthMapMaterial extends ShaderMaterial {

	constructor ( terrain ) {

		const boundingBox = terrain.boundingBox;

		const minHeight = boundingBox.min.z;
		const maxHeight = boundingBox.max.z;

		super( {
			vertexShader: Shaders.depthMapVertexShader,
			fragmentShader: Shaders.depthMapFragmentShader,
			type: 'CV.DepthMapMaterial',
			depthWrite: false,
			uniforms: {
				minZ:   { value: minHeight },
				scaleZ: { value: 1 / ( maxHeight - minHeight ) }
			}
		} );

	}

}

export { DepthMapMaterial };