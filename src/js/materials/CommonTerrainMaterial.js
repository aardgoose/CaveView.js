import { MeshPhongNodeMaterial, EqualStencilFunc, reference } from '../Three';

class CommonTerrainMaterial extends MeshPhongNodeMaterial {

	constructor ( params, ctx ) {

		super( params );

		this.opacityNode = reference( 'terrainOpacity', 'float', ctx.materials );

		this.transparent = true;
		this.stencilWrite = true;
		this.stencilFunc = EqualStencilFunc;

	}

}

export { CommonTerrainMaterial };