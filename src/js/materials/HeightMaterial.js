
import { MATERIAL_LINE } from '../core/constants';
import { Shaders } from '../shaders/Shaders';
import { ColourCache } from '../core/ColourCache';

import { ShaderMaterial, Color } from '../Three';

function HeightMaterial ( type, survey ) {

	const limits = survey.modelLimits;

	const zMin = limits.min.z;
	const zMax = limits.max.z;

	ShaderMaterial.call( this, {
		vertexShader: Shaders.heightVertexShader,
		fragmentShader: Shaders.heightFragmentShader,
		type: 'CV.HeightMaterial',
		uniforms: {
			uLight: { value: survey.lightDirection },
			minZ:   { value: zMin },
			scaleZ: { value: 1 / ( zMax - zMin ) },
			cmap:   { value: ColourCache.getTexture( 'gradient' ) },
			fogNear: { value: 1 },
			fogFar: { value: 300 },
			fogColor: { value: new Color( 0x222222 ) }
		},
		defines: {
			USE_COLOR: true,
			SURFACE: ( type !== MATERIAL_LINE )
		}
	} );

	return this;

}

HeightMaterial.prototype = Object.create( ShaderMaterial.prototype );

export { HeightMaterial };

// EOF