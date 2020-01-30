import { Point } from './Point';

function Marker( ctx, count ) {

	const materials = ctx.materials;

	Point.call( this, materials.getClusterMaterial( count ) );

	return this;

}

Marker.prototype = Object.create( Point.prototype );

Marker.prototype.isMarker = true;

Marker.prototype.adjustHeight = function ( func ) {

	this.position.setZ( func( this.position ) + 10 );

};

export { Marker };