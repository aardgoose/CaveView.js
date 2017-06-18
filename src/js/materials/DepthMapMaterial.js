
import { Shaders } from '../shaders/Shaders';
import { ShaderMaterial } from '../../../../three.js/src/Three';

function DepthMapMaterial ( minHeight, maxHeight ) {

	ShaderMaterial.call( this, {

		uniforms: {

			minZ:   { value: minHeight },
			scaleZ: { value: 1 / ( maxHeight - minHeight ) }

		},

		vertexShader:    Shaders.depthMapVertexShader,
		fragmentShader:  Shaders.depthMapFragmentShader,
		depthWrite:      false,
		type:            'CV.DepthMapMaterial'

	} );

	return this;

}

DepthMapMaterial.prototype = Object.create( ShaderMaterial.prototype );

DepthMapMaterial.prototype.constructor = DepthMapMaterial;

export { DepthMapMaterial };

// EOF