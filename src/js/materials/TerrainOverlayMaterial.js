import { CommonTerrainMaterial } from './CommonTerrainMaterial';
import { Shaders } from '../shaders/Shaders';

class TerrainOverlayMaterial extends CommonTerrainMaterial {

	constructor ( ctx ) {

		super();

		this.transparent = true;

		this.onBeforeCompile = function ( shader ) {

			// some uniforms shared by all material instances
			Object.assign( shader.uniforms, ctx.materials.commonTerrainUniforms );

			this.editShader( shader,
				'varying vec2 vPosition;',
				'vPosition = vec2( position.x, position.y );',
				Shaders.commonTerrainCodePars,
				Shaders.commonTerrainCodeColor );

		};

		Object.defineProperty( this, 'opacity', {
			get: function () { return ctx.materials.terrainOpacity; }
		} );

	}

}

export { TerrainOverlayMaterial };