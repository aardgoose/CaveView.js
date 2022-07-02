import { CommonTerrainMaterial } from './CommonTerrainMaterial';

class TerrainOverlayMaterial extends CommonTerrainMaterial {

	constructor ( ctx ) {

		super( ctx );

		this.onBeforeCompile = function ( shader ) {

			this.commonBeforeCompile( ctx, shader );

			this.editVertexShader( shader,
				'varying vec2 vPosition;',
				'vPosition = vec2( position.x, position.y );'
			);

		};

	}

}

export { TerrainOverlayMaterial };