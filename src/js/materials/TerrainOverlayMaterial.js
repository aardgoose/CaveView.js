import { CommonTerrainMaterial } from './CommonTerrainMaterial';

class TerrainOverlayMaterial extends CommonTerrainMaterial {

	name = 'CV:TerrainOverlayMaterial';

	constructor ( params = {}, ctx ) {

		super( params, ctx );
		// FIXME - location

	}

}

export { TerrainOverlayMaterial };