import { CommonTerrainMaterial } from './CommonTerrainMaterial';

class MissingMaterial extends CommonTerrainMaterial {

	constructor ( ctx ) {

		super( ctx, { color: 0xff8888} );

		this.transparent = true;
		this.ctx = ctx;


	}

	get opacity() { return this.ctx.materials.terrainOpacity; }

}

export { MissingMaterial };