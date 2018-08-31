import { Group } from '../Three';
import { PointIndicator } from './PointIndicator';

function StationMarkers ( color ) {

	Group.call( this );

	this.markers = [];
	this.markerColor = color;

	return this;

}

StationMarkers.prototype = Object.create( Group.prototype );

StationMarkers.prototype.mark = function ( node ) {

	const markers = this.markers;

	if ( markers[ node.id ] !== undefined ) return;

	const marker = new PointIndicator( this.markerColor );

	marker.position.copy( node.p );

	this.add( marker );

	markers[ node.id ] = marker;

};

StationMarkers.prototype.unmark = function ( node ) {

	const markers = this.markers;

	const marker = markers[ node.id ];

	if ( marker === undefined ) return;

	this.remove( marker );

	delete markers[ node.id ];

};

StationMarkers.prototype.clear = function () {

	const self = this;

	this.markers.forEach( function ( marker ) {

		self.remove( marker );

	} );

	this.markers = [];

};

StationMarkers.prototype.setVisibility = function ( visible ) {

	this.markers.forEach( function ( marker ) { marker.visible = visible; } );

};

export { StationMarkers };