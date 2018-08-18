import { Group } from '../Three';
import { PointIndicator } from './PointIndicator';

function StationMarkers () {

	Group.call( this );

	this.markers = new Map();
}

StationMarkers.prototype = Object.create( Group.prototype );

StationMarkers.prototype.mark = function ( node ) {

	const markers = this.markers;

	if ( markers.has( node ) ) return;

	const marker = new PointIndicator( 0x00ff00 );

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

		marker.geometry.dispose();

		self.remove( marker );

	} );

	this.markers.clear();

};

export { StationMarkers };