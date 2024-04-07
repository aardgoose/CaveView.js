import { EqualStencilFunc } from '../Three';
import { MeshPhongNodeMaterial } from '../Nodes';

class CommonTerrainMaterial extends MeshPhongNodeMaterial {

	constructor ( params, ctx ) {

		super( params );

		this.opacityNode = ctx.materials.getReference( 'terrainOpacity' );

		this.transparent = true;
		this.stencilWrite = true;
		this.stencilFunc = EqualStencilFunc;

	}

}

export { CommonTerrainMaterial };