
import { Shaders } from '../shaders/Shaders';
import { ShaderMaterial } from '../Three';

function DepthMapMaterial ( terrain ) {

	if ( terrain.boundingBox === undefined ) terrain.computeBoundingBox();

	const boundingBox = terrain.boundingBox;

	const minHeight = boundingBox.min.z;
	const maxHeight = boundingBox.max.z;

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