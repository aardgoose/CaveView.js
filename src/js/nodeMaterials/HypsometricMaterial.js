import { MeshPhongNodeMaterial, float,saturate, uniform, varying, vec2, texture, positionGeometry } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class HypsometricMaterial extends MeshPhongNodeMaterial {

	constructor ( ctx ) {

		const survey = ctx.survey;
		const cfg = ctx.cfg;
		const terrain = survey.terrain;
		const textureCache = ctx.materials.textureCache;

		super();

		if ( terrain ) {

			if ( terrain.boundingBox === undefined ) terrain.computeBoundingBox();

			const zMin = cfg.themeValue( 'shading.hypsometric.min', terrain.boundingBox.min.z );
			const zMax = cfg.themeValue( 'shading.hypsometric.max', terrain.boundingBox.max.z );

			const minZ = uniform( zMin, 'float' );
			const scaleZ = uniform( 1 / ( zMax - zMin ), 'float' );

			const zMap = varying( saturate( positionGeometry.z.sub( minZ ).mul( scaleZ ) ) );

			this.colorNode = texture( textureCache.getTexture( 'hypsometric' ), vec2( zMap.oneMinus(), 1.0 ) );

		}

	}

}

export { HypsometricMaterial };