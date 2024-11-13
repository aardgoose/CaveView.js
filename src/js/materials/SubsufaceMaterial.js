import { MeshPhongNodeMaterial } from '../Three';

class SubsurfaceMaterial extends MeshPhongNodeMaterial {

	static isSubsurfaceMaterial = true;

	constructor ( options = {}, ctx ) {

		super( options );

		this.ctx = ctx;
		this.lightsNode = ctx.lightingManager.getSubsurfaceLights();

	}

}

export { SubsurfaceMaterial };