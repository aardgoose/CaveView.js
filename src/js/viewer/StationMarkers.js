import { Group } from '../Three';
import { PointIndicator } from './PointIndicator';

function StationMarkers ( color ) {

	Group.call( this );

	this.markers = new Map();
	this.markerColor = color;

	return this;

}

StationMarkers.prototype = Object.create( Group.prototype );

StationMarkers.prototype.mark = function ( node ) {

	const markers = this.markers;

	if ( markers.has( node ) ) return;

	const marker = new PointIndicator( this.markerColor );

	marker.position.copy( node.p );

	this.add( marker );

	markers.set( node, marker );

};

StationMarkers.prototype.unmark = function ( node ) {

	const markers = this.markers;

	const marker = markers.get( node );

	if ( marker === undefined ) return;

	this.remove( marker );

	markers.delete( node );

};

StationMarkers.prototype.clear = function () {

	const self = this;

	this.markers.forEach( function ( marker ) {

		self.remove( marker );

	} );

	this.markers.clear();

};

StationMarkers.prototype.getStations = function () {

	const list = [];

	this.markers.forEach( function ( value, key ) { list.push( key ); } );

	return list;

};

StationMarkers.prototype.setVisibility = function ( visible ) {

	this.markers.forEach( function ( marker ) { marker.visible = visible; } );

};

export { StationMarkers };