
import { Shaders } from '../shaders/Shaders';
import { ShaderMaterial } from '../Three';

function DepthMapMaterial ( terrain ) {

	if ( terrain.boundingBox === undefined ) terrain.computeBoundingBox();

	const boundingBox = terrain.boundingBox;

	const minHeight = boundingBox.min.z;
	const maxHeight = boundingBox.max.z;

	ShaderMaterial.call( this, {
		vertexShader:    Shaders.depthMapVertexShader,
		fragmentShader:  Shaders.depthMapFragmentShader,
		type:            'CV.DepthMapMaterial',
		depthWrite:      false,
		uniforms: {
			minZ:   { value: minHeight },
			scaleZ: { value: 1 / ( maxHeight - minHeight ) }
		}
	} );

	return this;

}

DepthMapMaterial.prototype = Object.create( ShaderMaterial.prototype );

export { DepthMapMaterial };

// EOF