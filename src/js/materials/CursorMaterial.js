import { ShaderMaterial, cloneUniforms } from '../Three';
import { Shaders } from './shaders/Shaders';

class CursorMaterial extends ShaderMaterial {

	constructor ( ctx ) {

		const survey = ctx.survey;
		const limits = survey.modelLimits;
		const uniforms = ctx.materials.uniforms;

		super( {
			vertexShader: Shaders.cursorVertexShader,
			fragmentShader: Shaders.cursorFragmentShader,
			type: 'CV.CursorMaterial',
			uniforms: Object.assign( {
				uLight:      { value: survey.lightDirection }
			}, cloneUniforms( uniforms.cursor ),
			uniforms.common ),
			defines: {
				USE_COLOR: true
			}
		} );

		this.halfRange = ( limits.max.z - limits.min.z ) / 2;
		this.uniforms.cursor.value = 0;
	}

	setCursor ( value ) {

		const newValue = Math.max( Math.min( value, this.halfRange ), -this.halfRange );

		this.uniforms.cursor.value = newValue;

		return newValue; // return value clamped to material range

	}

	getCursor () {

		return this.uniforms.cursor.value;

	}

}

export { CursorMaterial };