import { ClusterMaterial } from '../materials/ClusterMaterial';
import { Sprite } from '../Three';

class Marker extends Sprite {

	isMarker = true;

	constructor ( ctx, count ) {

		super( ctx.materials.getMaterial( ClusterMaterial, { count: count } ) );
		this.renderOrder = 1;
		this.scale.set( 100, 100 );

	}

	adjustHeight ( func ) {

		this.position.setZ( func( this.position ) + 10 );

	}

}

export { Marker };