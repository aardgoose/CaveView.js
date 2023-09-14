import { texture, vec2, positionLocal } from '../Nodes';
import { SubsurfaceMaterial } from './SubsufaceMaterial';
import { CommonComponents } from './CommonComponents';

class DepthMaterial extends SubsurfaceMaterial {

	constructor ( options, ctx ) {

		const survey = ctx.survey;
		const terrain = survey.terrain;
		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const materials = ctx.materials;
		const textureCache = materials.textureCache;

		super( { transparent: options.location }, ctx );

		const du = materials.commonUniforms.depth();

		const terrainHeight = CommonComponents.terrainHeight( du, terrain );

		// FIXME double check all depth calcs
		const depth = terrainHeight( positionLocal ).sub( positionLocal.z ).mul( du.depthScale );

		this.colorNode = texture( textureCache.getTexture( gradient ), vec2( depth, 1.0 ) ); // FIXME vertex color

	}

}

export { DepthMaterial };