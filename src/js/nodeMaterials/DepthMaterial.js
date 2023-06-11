import { MeshPhongNodeMaterial, texture, vec2, positionLocal } from '../../../node_modules/three/examples/jsm/nodes/Nodes';
import { CommonComponents } from './CommonComponents';
import { CommonUniforms } from './CommonUniforms';

class DepthMaterial extends MeshPhongNodeMaterial {

	constructor ( ctx, options ) {

		const survey = ctx.survey;
		const terrain = survey.terrain;
		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const textureCache = ctx.materials.textureCache;

		super( { transparent: options.location } );

		const du = CommonUniforms.depth( ctx );

		const terrainHeight = CommonComponents.terrainHeight( du, terrain );

		// FIXME double check all depth calcs
		const depth = terrainHeight.sub( positionLocal.z ).mul( du.depthScale );

		this.colorNode = texture( textureCache.getTexture( gradient ), vec2( depth, 1.0 ) ); // FIXME vertex colot

		// FIXME add location code

	}

}

export { DepthMaterial };