import { positionLocal, reference } from '../Three.js';
import { SubsurfaceMaterial } from './SubsufaceMaterial';
import { cursorColor, getTerrainHeight } from './CommonComponents';

class DepthCursorMaterial extends SubsurfaceMaterial {

	constructor( options, ctx ) {

		super( { vertexColors: true }, ctx );

		const survey = ctx.survey;
		const surveyLimits = survey.modelLimits;
		const commonUniforms = ctx.materials.commonUniforms;

		// max range of depth values
		const max = surveyLimits.max.z - surveyLimits.min.z;

		const du = commonUniforms.depth( ctx );

		const terrainHeight = getTerrainHeight( du, survey.terrain );

		// FIXME double check all depth calcs

		const vCursor = terrainHeight.sub( positionLocal.z );

		const cursorHeight = reference( 'cursorHeight', 'float', ctx.materials );
		const delta = vCursor.sub( cursorHeight );

		this.colorNode = cursorColor( ctx, delta ).rgb;

//		this.transparent = options.location;
		this.ctx.materials.cursorHeight = max;

	}


}

export { DepthCursorMaterial };