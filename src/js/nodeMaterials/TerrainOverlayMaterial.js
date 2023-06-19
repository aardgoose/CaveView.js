import { CommonTerrainMaterial } from './CommonTerrainMaterial';

class TerrainOverlayMaterial extends CommonTerrainMaterial {

	constructor ( params = {}, ctx ) {

		super( params, ctx );
		// FIXME - location 
		this.name = 'CV:TerrainOverlayMaterial'

	}

}

export { TerrainOverlayMaterial };