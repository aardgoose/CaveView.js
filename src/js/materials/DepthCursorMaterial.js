import { ShaderMaterial, Vector3, cloneUniforms } from '../Three';
import { Shaders } from './shaders/Shaders';

class DepthCursorMaterial extends ShaderMaterial {

	constructor( ctx, options ) {

		const survey = ctx.survey;
		const surveyLimits = survey.modelLimits;
		const terrain = survey.terrain;

		const limits = terrain.boundingBox;
		const range = limits.getSize( new Vector3() );

		// max range of depth values
		const max = surveyLimits.max.z - surveyLimits.min.z;
		const uniforms = ctx.materials.uniforms;

		super( {
			vertexShader: Shaders.depthCursorVertexShader,
			fragmentShader: Shaders.depthCursorFragmentShader,
			type: 'CV.DepthCursorMaterial',
			uniforms: Object.assign( {
				uLight:      { value: survey.lightDirection },
				modelMin:    { value: limits.min },
				scaleX:      { value: 1 / range.x },
				scaleY:      { value: 1 / range.y },
				rangeZ:      { value: range.z },
				depthMap:    { value: terrain.depthTexture }
			}, cloneUniforms( uniforms.cursor ),
			uniforms.common, uniforms.commonDepth ),
			defines: {
				USE_COLOR: true,
				CV_LOCATION: options.location
			}
		} );

		this.transparent = options.location;
		this.max = max;
		this.uniforms.cursor.value = max;

	}

	setCursor ( value ) {

		const newValue = Math.max( Math.min( value, this.max ), 0 );

		this.uniforms.cursor.value = newValue;

		return newValue; // return value clamped to material range

	}

	getCursor () {

		return this.uniforms.cursor.value;

	}

}

export { DepthCursorMaterial };