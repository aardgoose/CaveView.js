import { varying, positionGeometry, reference } from '../Three.js';
import { SubsurfaceMaterial } from './SubsufaceMaterial.js';
import { cursorColor } from './CommonComponents';

class CursorMaterial extends SubsurfaceMaterial {

	constructor ( options, ctx ) { // FIXME options handling

		super( { vertexColors: true }, ctx );

		const survey = ctx.survey;
		const limits = survey.modelLimits;

		const cursorHeight = reference( 'cursorHeight', 'float', ctx.materials );
		const delta = varying( positionGeometry.z.sub( cursorHeight ) );

		this.colorNode = cursorColor( ctx, delta );

		this.transparent = options.location;
		this.halfRange = ( limits.max.z - limits.min.z ) / 2;

	}

}

export { CursorMaterial };