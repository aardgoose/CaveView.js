import { Vector3 } from '../Three';
import { MeshPhongNodeMaterial, float, expression, texture, uniform, varying, vec2, vec3, vec4, positionGeometry, positionLocal } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class DepthMaterial extends MeshPhongNodeMaterial {

	constructor ( ctx, options ) {

		const survey = ctx.survey;
		const surveyLimits = survey.modelLimits;
		const terrain = survey.terrain;
		const limits = terrain.boundingBox;
		const range = limits.getSize( new Vector3() );
		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const textureCache = ctx.materials.textureCache;

		super( { transparent: options.location } );

		const modelMin   = uniform( limits.min, 'vec3' );
		const scaleX     = uniform( 1 / range.x, 'float' );
		const scaleY     = uniform( 1 / range.y, 'float' );
		const rangeZ     = uniform( range.z, 'float' );
		const depthScale = uniform( 1 / ( surveyLimits.max.z - surveyLimits.min.z ), 'float' );
		const datumShift = uniform( 0, 'float' ); // FIXME

		// unpack functions

		const UnpackDownscale = float( 255. / 256. ); // 0..1 -> fraction (excluding 1)

		const PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
		const UnpackFactors = vec4( UnpackDownscale.div( vec4( PackFactors, 1. ) ) );

		const vTerrainCoords = varying( vec2( positionGeometry.x.sub( modelMin.x ).mul( scaleX ), positionGeometry.y.sub( modelMin.y ).mul( scaleY ) ) );

		let terrainHeight = texture( terrain.depthTexture, vTerrainCoords ).dot( UnpackFactors ); // FIXME

		terrainHeight = terrainHeight.mul( rangeZ ).add( modelMin.z ).add( datumShift );

		const depth = terrainHeight.sub( positionLocal.z ).mul( depthScale );

		this.colorNode = texture( textureCache.getTexture( gradient ), vec2( depth, 1.0 ) ); // FIXME vertex colot

		// FIXME add location code

	}

}

export { DepthMaterial };