import { CommonTerrainMaterial } from './CommonTerrainMaterial';

class TerrainOverlayMaterial extends CommonTerrainMaterial {

	constructor ( ctx ) {

		super( ctx );

		this.transparent = true;

		this.onBeforeCompile = function ( shader ) {

			this.editShader( shader,
				'varying vec2 vPosition;',
				'vPosition = vec2( position.x, position.y );',
				'',
				'' );

		};

	}

}

export { TerrainOverlayMaterial };