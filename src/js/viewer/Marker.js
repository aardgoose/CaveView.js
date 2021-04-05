import { Point } from './Point';

class Marker extends Point {

	constructor ( ctx, count ) {

		const materials = ctx.materials;

		super( materials.getClusterMaterial( count ), ctx );
		this.renderOrder = 1;

	}

}

Marker.prototype.isMarker = true;

Marker.prototype.adjustHeight = function ( func ) {

	this.position.setZ( func( this.position ) + 10 );

};

export { Marker };