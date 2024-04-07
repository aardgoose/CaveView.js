import { positionGeometry, attribute, texture, vec2, temp, vec3 } from '../Nodes.js';
import { CommonComponents } from './CommonComponents';
import { SurveyLineMaterial } from './SurveyLineMaterial.js';

class DepthLineMaterial extends SurveyLineMaterial {

	constructor ( params = {}, ctx ) {

		super( params, ctx );

		const survey = ctx.survey;
		const terrain = survey.terrain;

		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const textureCache = ctx.materials.textureCache;

		const du = ctx.materials.commonUniforms.depth();

		const instanceStart = attribute( 'instanceStart' );
		const instanceEnd   = attribute( 'instanceEnd' );

		const vPosition = temp( vec3() ).assign( positionGeometry.y.lessThan( 0.5 ).cond( instanceStart, instanceEnd ) );
		const terrainHeight = CommonComponents.terrainHeight( du, terrain, vPosition );

		// FIXME double check all depth calcs
//		const depth = terrainHeight( vPosition ).sub( vPosition.z ).mul( du.depthScale );

		const depth = terrainHeight; //.sub( vPosition.z ).mul( du.depthScale );

		this.lineColorNode = texture( textureCache.getTexture( gradient ), vec2( depth, 1.0 ) ).rgb; // FIXME vertex colot

	}

}

export { DepthLineMaterial };