import { SurveyLineMaterial } from './SurveyLineMaterial.js';
import { positionGeometry, attribute, texture, varying, vec2 } from '../Three.js';

class HeightLineMaterial extends SurveyLineMaterial {

	constructor ( params = {}, ctx ) {

		super( params, ctx );

		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const textureCache = ctx.materials.textureCache;

		const hu = ctx.materials.commonUniforms.height();

		const instanceStart = attribute( 'instanceStart' );
		const instanceEnd   = attribute( 'instanceEnd' );

		const vPosition = positionGeometry.y.lessThan( 0.5 ).select( instanceStart, instanceEnd );

		const zMap = varying( vPosition.z.sub( hu.minZ ).mul( hu.scaleZ ) );
		this.lineColorNode = texture( textureCache.getTexture( gradient ), vec2( zMap.oneMinus(), 1.0 ) ).rgb;

	}

}

export { HeightLineMaterial };