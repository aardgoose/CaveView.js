import { positionGeometry, attribute, varying } from '../Nodes.js';
import { Line2Material } from './Line2Material.js';
import { CommonComponents } from './CommonComponents.js';

class CursorLineMaterial extends Line2Material {

	name = 'CursorLineMaterial';

	constructor ( params = {}, ctx ) {

		super( params, ctx );

		const cu = ctx.materials.commonUniforms.cursor( ctx );
		const survey = ctx.survey;
		const limits = survey.modelLimits;

		const instanceStart = attribute( 'instanceStart', 'vec3' );
		const instanceEnd   = attribute( 'instanceEnd', 'vec3' );

		const vPosition = positionGeometry.y.lessThan( 0.5 ).cond( instanceStart, instanceEnd );

		const delta = varying( vPosition.z.sub( cu.cursor ) );

		this.colorInsert = CommonComponents.cursorColor( cu, delta );

		this.cursor = cu.cursor;
		this.halfRange = ( limits.max.z - limits.min.z ) / 2;

	}

}

export { CursorLineMaterial };