import { EqualStencilFunc } from '../Three';
import { MeshPhongNodeMaterial } from '../Nodes';

class CommonTerrainMaterial extends MeshPhongNodeMaterial {

	name = 'CV:CommonTerrainMaterial';

	constructor ( params, ctx ) {

		super( params );

		Object.defineProperty( this, 'opacity', {
			get() { return ctx.materials.terrainOpacity; }
		} );

		this.transparent = true;
		this.stencilWrite = true;
		this.stencilFunc = EqualStencilFunc;

	}

	customProgramCacheKey () {

		return this.name;

	}

}

export { CommonTerrainMaterial };