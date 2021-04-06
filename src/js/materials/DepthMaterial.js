import { Shaders } from '../shaders/Shaders';
import { MATERIAL_LINE } from '../core/constants';

import { ShaderMaterial, Vector3 } from '../Three';

class DepthMaterial extends ShaderMaterial {

	constructor ( ctx, type ) {

		const survey = ctx.survey;
		const surveyLimits = survey.modelLimits;
		const terrain = survey.terrain;
		const limits = terrain.boundingBox;
		const range = limits.getSize( new Vector3() );
		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const textureCache = ctx.materials.textureCache;

		super( {
			vertexShader: Shaders.depthVertexShader,
			fragmentShader: Shaders.depthFragmentShader,
			type: 'CV.DepthMaterial',
			uniforms: Object.assign( {
				// pseudo light source somewhere over viewer's left shoulder.
				uLight:     { value: survey.lightDirection },
				modelMin:   { value: limits.min },
				scaleX:     { value: 1 / range.x },
				scaleY:     { value: 1 / range.y },
				rangeZ:     { value: range.z },
				depthScale: { value: 1 / ( surveyLimits.max.z - surveyLimits.min.z ) },
				cmap:       { value: textureCache.getTexture( gradient ) },
				depthMap:   { value: terrain.depthTexture },
			}, ctx.materials.commonUniforms, ctx.materials.commonDepthUniforms ),
			defines: {
				USE_COLOR: true,
				SURFACE: ( type !== MATERIAL_LINE )
			}
		} );

	}

}

export { DepthMaterial };