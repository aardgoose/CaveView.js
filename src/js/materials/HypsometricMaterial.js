import { CommonTerrainMaterial } from './CommonTerrainMaterial';

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

		}

	}

}

export { HypsometricMaterial };