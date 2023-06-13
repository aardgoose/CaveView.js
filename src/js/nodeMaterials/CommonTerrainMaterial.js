import { EqualStencilFunc } from '../Three';
import { MeshPhongNodeMaterial } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class CommonTerrainMaterial extends MeshPhongNodeMaterial {

	constructor ( ctx, parameters ) {

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