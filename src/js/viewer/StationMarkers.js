import { Group } from '../Three';
import { PointIndicator } from './PointIndicator';

class StationMarkers extends Group {

	constructor ( ctx, color ) {

		super();

		this.markers = new Map();
		this.markerColor = color;
		this.ctx = ctx;

	}

	mark ( node ) {

		const markers = this.markers;

		if ( markers.has( node ) ) return;

		const marker = new PointIndicator( this.ctx, this.markerColor );

		marker.position.copy( node );
		marker.station = node;
		marker.layers = this.layers;

		this.add( marker );

		markers.set( node, marker );

	}

	unmark ( node ) {

		const markers = this.markers;

		const marker = markers.get( node );

		if ( marker === undefined ) return;

		this.remove( marker );

		markers.delete( node );

	}

	clear () {

		this.markers.forEach( marker => this.remove( marker ) );
		this.markers.clear();

	}

	getStations () {

		return this.markers.keys();

	}

	setVisibility ( visible ) {

		this.markers.forEach( marker => marker.visible = visible );

	}

}

export { StationMarkers };