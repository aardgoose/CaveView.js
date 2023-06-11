import { CommonTerrainMaterial } from './CommonTerrainMaterial';

class MissingMaterial extends CommonTerrainMaterial {

	constructor ( ctx ) {

		super( ctx, { color: 0xff8888} );

	}

}

export { MissingMaterial };