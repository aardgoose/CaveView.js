import { Shaders } from '../shaders/Shaders';
import { ShaderMaterial } from '../Three';

class CursorMaterial extends ShaderMaterial {

	constructor ( ctx ) {

		const survey = ctx.survey;
		const cfg = ctx.cfg;
		const limits = survey.modelLimits;

		super( {
			vertexShader: Shaders.cursorVertexShader,
			fragmentShader: Shaders.cursorFragmentShader,
			type: 'CV.CursorMaterial',
			uniforms: Object.assign( {
				uLight:      { value: survey.lightDirection },
				cursor:      { value: 0 },
				cursorWidth: { value: 5.0 },
				baseColor:   { value: cfg.themeColor( 'shading.cursorBase' ) },
				cursorColor: { value: cfg.themeColor( 'shading.cursor' ) },
			}, ctx.materials.commonUniforms ),
			defines: {
				USE_COLOR: true
			}
		} );

		this.halfRange = ( limits.max.z - limits.min.z ) / 2;

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