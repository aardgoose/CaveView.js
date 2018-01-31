import { Materials } from '../materials/Materials';
import { Point } from './Point';
import { StencilLib } from '../core/StencilLib';

function Marker( count ) {

	Point.call( this, Materials.getClusterMaterial( count ) );

	this.onBeforeRender = StencilLib.featureOnBeforeRender;
	this.onAfterRender = StencilLib.featureOnAfterRender;

	return this;

}

Marker.prototype = Object.create( Point.prototype );

Marker.prototype.isMarker = true;

Marker.prototype.adjustHeight = function ( func ) {

	this.position.setZ( func( this.position ) + 10 );

};

export { Marker };