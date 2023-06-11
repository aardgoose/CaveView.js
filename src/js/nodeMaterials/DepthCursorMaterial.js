import { MeshPhongNodeMaterial, positionLocal } from '../../../node_modules/three/examples/jsm/nodes/Nodes.js';
import { CommonUniforms } from './CommonUniforms';
import { CommonComponents } from './CommonComponents';

class DepthCursorMaterial extends MeshPhongNodeMaterial {

	constructor( ctx, options ) {

		super( { vertexColors: true } );

		const survey = ctx.survey;
		const surveyLimits = survey.modelLimits;

		// max range of depth values
		const max = surveyLimits.max.z - surveyLimits.min.z;

		const cu = CommonUniforms.cursor( ctx );
		const du = CommonUniforms.depth( ctx );

		const terrainHeight = CommonComponents.terrainHeight( du, survey.terrain );

		// FIXME double check all depth calcs

		const vCursor = terrainHeight.sub(  positionLocal.z );

		const delta = vCursor.sub( cu.cursor );

		this.colorNode = CommonComponents.cursorColor( cu, delta );

		this.cursor = cu.cursor;
		this.transparent = options.location;
		this.max = max;
		this.cursor.value = max;

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