import { positionGeometry, attribute, reference, varying } from '../Three.js';
import { cursorColor } from './CommonComponents.js';
import { SurveyLineMaterial } from './SurveyLineMaterial.js';

class CursorLineMaterial extends SurveyLineMaterial {;

	constructor ( params = {}, ctx ) {

		super( params, ctx );

		const instanceStart = attribute( 'instanceStart' );
		const instanceEnd   = attribute( 'instanceEnd' );

		const cursorHeight = reference( 'cursorHeight', 'float', ctx.materials );
		const vPosition = positionGeometry.y.lessThan( 0.5 ).select( instanceStart, instanceEnd );

		const delta = varying( vPosition.z.sub( cursorHeight ) );

		this.lineColorNode = cursorColor( ctx, delta ).rgb;

	}

}

export { CursorLineMaterial };