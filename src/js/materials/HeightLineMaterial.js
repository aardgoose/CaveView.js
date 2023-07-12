import { positionGeometry, attribute, float, texture, varying, vec2 } from '../Nodes.js';
import { Line2Material } from './Line2Material';

class HeightLineMaterial extends Line2Material {

	name = 'HeightLineMaterial';

	constructor ( params = {}, ctx ) {

		super( params, ctx );

		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const textureCache = ctx.materials.textureCache;

		const hu = ctx.materials.commonUniforms.height();

		const instanceStart = attribute( 'instanceStart' );
		const instanceEnd   = attribute( 'instanceEnd' );

		const vPosition = positionGeometry.y.lessThan( 0.5 ).cond( instanceStart, instanceEnd );

		const zMap = varying( vPosition.z.sub( hu.minZ ).mul( hu.scaleZ ) );

		this.colorInsert = texture( textureCache.getTexture( gradient ), vec2( zMap.oneMinus(), 1.0 ) );

	}

}

export { HeightLineMaterial };