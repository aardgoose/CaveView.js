import { MeshPhongNodeMaterial } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class SubsurfaceMaterial extends MeshPhongNodeMaterial {

	constructor ( ctx, options = {} ) {

		super( options );

		this.lightsNode = ctx.lightingManager.getSubsurfaceLights();

	}

	customProgramCacheKey () {

		return this.name;

	}

}

export { SubsurfaceMaterial };