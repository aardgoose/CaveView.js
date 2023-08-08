import { Line2NodeMaterial, positionGeometry, attribute, texture, varying, vec2 } from '../Nodes.js';

class HeightLineMaterial extends Line2NodeMaterial {

	constructor ( params = {}, ctx ) {

		super( params, ctx );

		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const textureCache = ctx.materials.textureCache;

		const hu = ctx.materials.commonUniforms.height();

		const instanceStart = attribute( 'instanceStart' );
		const instanceEnd   = attribute( 'instanceEnd' );

		const vPosition = positionGeometry.y.lessThan( 0.5 ).cond( instanceStart, instanceEnd );

		const zMap = varying( vPosition.z.sub( hu.minZ ).mul( hu.scaleZ ) );

		this.lineColorNode = texture( textureCache.getTexture( gradient ), vec2( zMap.oneMinus(), 1.0 ) );

		this.constructShaders();

	}

}

export { HeightLineMaterial };