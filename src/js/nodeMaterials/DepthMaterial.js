import { MeshPhongNodeMaterial, float, texture, varying, vec2, vec3, vec4, positionGeometry, positionLocal } from '../../../node_modules/three/examples/jsm/nodes/Nodes';
import { CommonUniforms } from './CommonUniforms';

class DepthMaterial extends MeshPhongNodeMaterial {

	constructor ( ctx, options ) {

		const survey = ctx.survey;
		const terrain = survey.terrain;
		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const textureCache = ctx.materials.textureCache;

		super( { transparent: options.location } );

		const du = CommonUniforms.depth( ctx );

		// unpack functions

		const UnpackDownscale = float( 255. / 256. ); // 0..1 -> fraction (excluding 1)

		const PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
		const UnpackFactors = vec4( UnpackDownscale.div( vec4( PackFactors, 1. ) ) );

		const vTerrainCoords = varying( positionGeometry.xy.sub( du.modelMin.xy ).mul( du.scale ) );

		let terrainHeight = texture( terrain.depthTexture, vTerrainCoords ).dot( UnpackFactors ); // FIXME

		terrainHeight = terrainHeight.mul( du.rangeZ ).add( du.modelMin.z ).add( du.datumShift );

		const depth = terrainHeight.sub( positionLocal.z ).mul( du.depthScale );

		this.colorNode = texture( textureCache.getTexture( gradient ), vec2( depth, 1.0 ) ); // FIXME vertex colot

		// FIXME add location code

	}

}

export { DepthMaterial };