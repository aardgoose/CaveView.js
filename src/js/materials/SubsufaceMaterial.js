import { MeshPhongNodeMaterial } from '../Nodes';

class SubsurfaceMaterial extends MeshPhongNodeMaterial {

	static isSubsurfaceMaterial = true;

	constructor ( options = {}, ctx ) {

		super( options );

		this.lightsNode = ctx.lightingManager.getSubsurfaceLights();

	}

}

export { SubsurfaceMaterial };