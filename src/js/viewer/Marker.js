import { Point } from './Point';
import { ClusterMaterial } from '../nodeMaterials/ClusterMaterial';

class Marker extends Point {

	isMarker = true;

	constructor ( ctx, count ) {

		const materials = ctx.materials;

		super( materials.getMaterial( ClusterMaterial, { count: count } ) );
		this.renderOrder = 1;

	}

	adjustHeight ( func ) {

		this.position.setZ( func( this.position ) + 10 );

	}

}

export { Marker };