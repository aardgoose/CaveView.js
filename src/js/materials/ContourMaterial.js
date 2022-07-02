import { CommonTerrainMaterial } from './CommonTerrainMaterial';

class ContourMaterial extends CommonTerrainMaterial {

	constructor ( ctx ) {

		const survey = ctx.survey;
		const cfg = ctx.cfg;
		const materials = ctx.materials;

		super( ctx );

		this.extensions = { derivatives: true };

		this.onBeforeCompile = function ( shader ) {

			this.commonBeforeCompile( ctx, shader );

			Object.assign( shader.uniforms, {
				zOffset:         { value: survey.offsets.z },
				contourInterval: { value: cfg.themeValue( 'shading.contours.interval' ) },
				contourColor:    { value: cfg.themeColor( 'shading.contours.line' ) },
				contourColor10:  { value: cfg.themeColor( 'shading.contours.line10' ) },
				baseColor:       { value: cfg.themeColor( 'shading.contours.base' ) }
			}, materials.uniforms.commonDepth );

			this.editShaderInclude( shader, 'contour' );

		};

	}

}

export { ContourMaterial };