import { float, uniform, varying, vec2, texture, positionGeometry } from '../Nodes';
import { SubsurfaceMaterial } from './SubsufaceMaterial';

class HeightMaterial extends SubsurfaceMaterial {

	name ='CV:HightMaterial';

	constructor ( options, ctx ) { // FIXME option handlin

		super( options, ctx );

		const hu = ctx.materials.commonUniforms.height();

		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const textureCache = ctx.materials.textureCache;

		const zMap = varying( positionGeometry.z.sub( hu.minZ ).mul( hu.scaleZ ) );

		this.colorNode = texture( textureCache.getTexture( gradient ), vec2( float( 1.0 ).sub( zMap ), 1.0 ) );

	}

}

export { HeightMaterial };