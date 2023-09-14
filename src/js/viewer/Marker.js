import { ClusterMaterial } from '../materials/ClusterMaterial';
import { Popup } from '../ui/Popup';

class Marker extends Popup {

	isMarker = true;

	constructor ( ctx, count ) {

		super();

		this.material = ctx.materials.getMaterial( ClusterMaterial, { count: count } );
		this.renderOrder = 1;
		this.scale.set( 100, 100 );

	}

	adjustHeight ( func ) {

		this.position.setZ( func( this.position ) + 10 );

	}

}

export { Marker };