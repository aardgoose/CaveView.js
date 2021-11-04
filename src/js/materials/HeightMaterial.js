import { Shaders } from './shaders/Shaders';
import { ShaderMaterial } from '../Three';

class HeightMaterial extends ShaderMaterial {

	constructor ( ctx ) {

		const survey = ctx.survey;
		const limits = survey.modelLimits;

		const zMin = limits.min.z;
		const zMax = limits.max.z;
		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const textureCache = ctx.materials.textureCache;
		const uniforms = ctx.materials.uniforms;

		super( {
			vertexShader: Shaders.heightVertexShader,
			fragmentShader: Shaders.heightFragmentShader,
			type: 'CV.HeightMaterial',
			uniforms: Object.assign( {
				uLight: { value: survey.lightDirection },
				minZ:   { value: zMin },
				scaleZ: { value: 1 / ( zMax - zMin ) },
				cmap:   { value: textureCache.getTexture( gradient ) },
			}, uniforms.common ),
			defines: {
				USE_COLOR: true
			}
		} );

		this.midRange = ( zMax + zMin ) / 2;
	}

}

export { HeightMaterial };