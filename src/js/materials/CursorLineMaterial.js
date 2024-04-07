import { positionGeometry, attribute, varying } from '../Nodes.js';
import { CommonComponents } from './CommonComponents.js';
import { SurveyLineMaterial } from './SurveyLineMaterial.js';

class CursorLineMaterial extends SurveyLineMaterial {;

	constructor ( params = {}, ctx ) {

		super( params, ctx );

		const instanceStart = attribute( 'instanceStart' );
		const instanceEnd   = attribute( 'instanceEnd' );

		const cursorHeight = ctx.materials.getReference( 'cursorHeight' );
		const vPosition = positionGeometry.y.lessThan( 0.5 ).cond( instanceStart, instanceEnd );

		const delta = varying( vPosition.z.sub( cursorHeight ) );

		this.lineColorNode = CommonComponents.cursorColor( ctx, delta ).rgb;

	}

}

export { CursorLineMaterial };