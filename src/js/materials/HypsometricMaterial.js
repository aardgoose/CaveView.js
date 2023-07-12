import { CommonTerrainMaterial } from './CommonTerrainMaterial';
import { saturate, texture, varying, vec2, positionGeometry } from '../Nodes';

class HypsometricMaterial extends CommonTerrainMaterial {

	name = 'CV:HypsometricMaterial';

	constructor ( params = {}, ctx ) {

		const textureCache = ctx.materials.textureCache;

		super( params, ctx );

		const tu = ctx.materials.commonUniforms.terrain();

		const zMap = varying( saturate( positionGeometry.z.sub( tu.hypsometricMinZ ).mul( tu.hypsometricScaleZ ) ) );

		this.colorNode = texture( textureCache.getTexture( 'hypsometric' ), vec2( zMap, 1.0 ) );

	}

}

export { HypsometricMaterial };