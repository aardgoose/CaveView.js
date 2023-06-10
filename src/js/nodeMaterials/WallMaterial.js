import { MeshPhongNodeMaterial } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class WallMaterial extends MeshPhongNodeMaterial {

	constructor( ctx, options ) {

		super( { color: ctx.cfg.themeColor( 'shading.single' ) } );


		// FIXME location code

	}

};

export { WallMaterial };