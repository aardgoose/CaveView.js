import { varying, positionGeometry } from '../../../node_modules/three/examples/jsm/nodes/Nodes.js';
import { SubsurfaceMaterial } from './SubsufaceMaterial.js';
import { CommonComponents } from './CommonComponents';
import { CommonUniforms } from './CommonUniforms';


class CursorMaterial extends SubsurfaceMaterial {

	constructor ( ctx, options ) { // FIXME options handling

		super( ctx, { vertexColors: true } );

		this.name = 'CV:CursorMaterial';

		const survey = ctx.survey;
		const limits = survey.modelLimits;

		const cu = CommonUniforms.cursor( ctx );

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