import { varying, positionGeometry } from '../Nodes.js';
import { SubsurfaceMaterial } from './SubsufaceMaterial.js';
import { CommonComponents } from './CommonComponents';

class CursorMaterial extends SubsurfaceMaterial {

	constructor ( options, ctx ) { // FIXME options handling

		super( { vertexColors: true }, ctx );

		const survey = ctx.survey;
		const limits = survey.modelLimits;

		const cursorHeight = ctx.materials.getReference( 'cursorHeight' );
		const delta = varying( positionGeometry.z.sub( cursorHeight ) );

		this.colorNode = CommonComponents.cursorColor( ctx, delta );

		this.transparent = options.location;
		this.halfRange = ( limits.max.z - limits.min.z ) / 2;

	}

}

export { CursorMaterial };