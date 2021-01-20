import { MATERIAL_LINE } from '../core/constants';
import { Shaders } from '../shaders/Shaders';

import { ShaderMaterial } from '../Three';

function HeightMaterial ( ctx, type ) {

	const survey = ctx.survey;
	const limits = survey.modelLimits;

	const zMin = limits.min.z;
	const zMax = limits.max.z;
	const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
	const textureCache = ctx.materials.textureCache;

	this.midRange = ( zMax + zMin ) / 2;

	ShaderMaterial.call( this, {
		vertexShader: Shaders.heightVertexShader,
		fragmentShader: Shaders.heightFragmentShader,
		type: 'CV.HeightMaterial',
		uniforms: Object.assign( {
			uLight: { value: survey.lightDirection },
			minZ:   { value: zMin },
			scaleZ: { value: 1 / ( zMax - zMin ) },
			cmap:   { value: textureCache.getTexture( gradient ) },
		}, ctx.materials.commonUniforms ),
		defines: {
			USE_COLOR: true,
			SURFACE: ( type !== MATERIAL_LINE )
		}
	} );

	return this;

}

HeightMaterial.prototype = Object.create( ShaderMaterial.prototype );

export { HeightMaterial };