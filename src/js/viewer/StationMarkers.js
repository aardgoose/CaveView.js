import { Group } from '../Three';
import { PointIndicator } from './PointIndicator';

function StationMarkers ( ctx, color ) {

	Group.call( this );

	this.markers = new Map();
	this.markerColor = color;
	this.ctx = ctx;

	return this;

}

StationMarkers.prototype = Object.create( Group.prototype );

StationMarkers.prototype.mark = function ( node ) {

	const markers = this.markers;

	if ( markers.has( node ) ) return;

	const marker = new PointIndicator( this.ctx, this.markerColor );

	marker.position.copy( node.p );
	marker.station = node;
	marker.layers = this.layers;

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

	this.markers.forEach( marker => this.remove( marker ) );
	this.markers.clear();

};

StationMarkers.prototype.getStations = function () {

	const keys = [];

	this.markers.forEach( ( v, k ) => keys.push( k) );

	return keys;

};

StationMarkers.prototype.setVisibility = function ( visible ) {

	this.markers.forEach( marker => marker.visible = visible );

};

export { StationMarkers };