import { MeshPhongNodeMaterial, expression, abs, cond, mix, smoothstep, varying, vec4, positionGeometry } from '../../../node_modules/three/examples/jsm/nodes/Nodes.js';
import { CommonUniforms } from './CommonUniforms';

class DepthCursorMaterial extends MeshPhongMaterial {

	constructor( ctx, options ) {

		const survey = ctx.survey;
		const surveyLimits = survey.modelLimits;

		// max range of depth values
		const max = surveyLimits.max.z - surveyLimits.min.z;

		const cu = CommonUniforms.cursor( ctx );
		const du = CommonUniforms.depth( ctx );









		this.cursor = cu.cursor;
		this.transparent = options.location;
		this.max = max;
		this.uniforms.cursor.value = max;

	}

	setCursor ( value ) {

		const newValue = Math.max( Math.min( value, this.max ), 0 );

		this.cursor.value = newValue;

		return newValue; // return value clamped to material range

	}

	getCursor () {

		return this.cursor.value;

	}

}

export { DepthCursorMaterial };