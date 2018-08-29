
import { MATERIAL_LINE } from '../core/constants';
import { Shaders } from '../shaders/Shaders';
import { ColourCache } from '../core/ColourCache';

import { ShaderMaterial } from '../Three';
import { MaterialFog } from './MaterialFog';
import { Cfg } from '../core/lib';

function HeightMaterial ( type, survey ) {

	const limits = survey.modelLimits;

	const zMin = limits.min.z;
	const zMax = limits.max.z;
	const gradient = Cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';

	this.midRange = ( zMax + zMin ) / 2;

	ShaderMaterial.call( this, {
		vertexShader: Shaders.heightVertexShader,
		fragmentShader: Shaders.heightFragmentShader,
		type: 'CV.HeightMaterial',
		uniforms: Object.assign( {
			uLight: { value: survey.lightDirection },
			minZ:   { value: zMin },
			scaleZ: { value: 1 / ( zMax - zMin ) },
			cmap:   { value: ColourCache.getTexture( gradient ) },
		}, MaterialFog.uniforms ),
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