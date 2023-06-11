import { CommonTerrainMaterial } from './CommonTerrainMaterial';
import { saturate, texture, uniform, varying, vec2, positionGeometry } from '../../../node_modules/three/examples/jsm/nodes/Nodes';
import { CommonComponents } from './CommonComponents';

class HypsometricMaterial extends CommonTerrainMaterial {

	constructor ( ctx ) {

		const survey = ctx.survey;
		const cfg = ctx.cfg;
		const terrain = survey.terrain;
		const textureCache = ctx.materials.textureCache;

		super( ctx );

		if ( terrain ) {

			if ( terrain.boundingBox === undefined ) terrain.computeBoundingBox();

			const zMin = cfg.themeValue( 'shading.hypsometric.min', terrain.boundingBox.min.z );
			const zMax = cfg.themeValue( 'shading.hypsometric.max', terrain.boundingBox.max.z );

			const minZ = uniform( zMin, 'float' );
			const scaleZ = uniform( 1 / ( zMax - zMin ), 'float' );

			const zMap = varying( saturate( positionGeometry.z.sub( minZ ).mul( scaleZ ) ) );

			this.colorNode = CommonComponents.location( ctx, texture( textureCache.getTexture( 'hypsometric' ), vec2( zMap.oneMinus(), 1.0 ) ) );

		}

	}

}

export { HypsometricMaterial };