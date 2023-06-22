import { varying, positionGeometry } from '../Nodes.js';
import { SubsurfaceMaterial } from './SubsufaceMaterial.js';
import { CommonComponents } from './CommonComponents';


class CursorMaterial extends SubsurfaceMaterial {

	name = 'CV:CursorMaterial';

	constructor ( options, ctx ) { // FIXME options handling

		super( { vertexColors: true }, ctx );

		const survey = ctx.survey;
		const limits = survey.modelLimits;

		const cu = ctx.materials.commonUniforms.cursor( ctx );

		const delta = varying( positionGeometry.z.sub( cu.cursor ) );

		this.colorNode = CommonComponents.cursorColor( cu, delta );

		this.cursor = cu.cursor;
		this.transparent = options.location;
		this.halfRange = ( limits.max.z - limits.min.z ) / 2;

	}

	setCursor ( value ) {

		const newValue = Math.max( Math.min( value, this.halfRange ), -this.halfRange );

		this.cursor.value = newValue;

		return newValue; // return value clamped to material range

	}

	getCursor () {

		return this.cursor.value;

	}

}

export { CursorMaterial };