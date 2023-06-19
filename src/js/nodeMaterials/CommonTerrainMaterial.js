import { EqualStencilFunc } from '../Three';
import { MeshPhongNodeMaterial } from '../Nodes';

class CommonTerrainMaterial extends MeshPhongNodeMaterial {

	constructor ( parameters, ctx ) {

		super( parameters );

		Object.defineProperty( this, 'opacity', {
			get() { return ctx.materials.terrainOpacity; }
		} );

		this.transparent = true;
		this.stencilWrite = true;
		this.stencilFunc = EqualStencilFunc;

	}

}

export { CommonTerrainMaterial };