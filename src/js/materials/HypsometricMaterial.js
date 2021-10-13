import { CommonTerrainMaterial } from './CommonTerrainMaterial';

class HypsometricMaterial extends CommonTerrainMaterial {

	constructor ( ctx ) {

		const survey = ctx.survey;
		const cfg = ctx.cfg;
		const terrain = survey.terrain;
		const textureCache = ctx.materials.textureCache;

		super();

		let zMin = cfg.themeValue( 'shading.hypsometric.min' );
		let zMax = cfg.themeValue( 'shading.hypsometric.max' );

		if ( terrain.boundBox === undefined ) terrain.computeBoundingBox();

		if ( zMin === undefined ) zMin = terrain.boundingBox.min.z;
		if ( zMax === undefined ) zMax = terrain.boundingBox.max.z;

		this.transparent = true;

		this.onBeforeCompile = function ( shader ) {

			Object.assign(
				shader.uniforms,
				{
					minZ:   { value: zMin },
					scaleZ: { value: 1 / ( zMax - zMin ) },
					cmap:   { value: textureCache.getTexture( 'hypsometric' ) }
				}
			);

			this.editShaderInclude( shader, 'hypsometric' );

		};

		Object.defineProperty( this, 'opacity', {
			get: function () { return ctx.materials.terrainOpacity; }
		} );

	}

}

export { HypsometricMaterial };