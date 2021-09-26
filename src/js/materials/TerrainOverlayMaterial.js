import { CommonTerrainMaterial } from './CommonTerrainMaterial';

class TerrainOverlayMaterial extends CommonTerrainMaterial {

	constructor ( ctx ) {

		super();

		this.transparent = true;

		this.onBeforeCompile = function ( shader ) {

			this.editShader( shader,
				'varying vec2 vPosition;',
				'vPosition = vec2( position.x, position.y );',
				'',
				'' );

		};

		Object.defineProperty( this, 'opacity', {
			get: function () { return ctx.materials.terrainOpacity; }
		} );

	}

}

export { TerrainOverlayMaterial };