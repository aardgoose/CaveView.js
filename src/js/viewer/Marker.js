import { Materials } from '../materials/Materials';
import { Point } from './Point';
import { StencilLib } from '../core/StencilLib';

function Marker( count ) {

	Point.call( this, Materials.getClusterMaterial( count ) );

	return this;

}

Marker.prototype = Object.create( Point.prototype );

Marker.prototype.isMarker = true;

Marker.prototype.onBeforeRender = StencilLib.featureOnBeforeRender;
Marker.prototype.onAfterRender = StencilLib.featureOnAfterRender;

Marker.prototype.adjustHeight = function ( func ) {

	this.position.setZ( func( this.position ) + 10 );

};

export { Marker };