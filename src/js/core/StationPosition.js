// extend Vector3 to add methods to calculate lengths corrected for distortions introduced
// by web mercator projection and add connection count

import { Vector3 } from '../Three.js';
import { Tree } from './Tree';

class StationPosition extends Vector3 {

	constructor ( x, y, z ) {

		super ( x, y, z );

		this.id = 0;
		this.parent = null;
		this.name = null;
		this.legs = [];
		this.linkedSegments = [];
		this.stationVertexIndex = -1;

	}

	effectiveConnections () {

		let connections = this.connections;
		let next = this.next;

		while ( next !== null && next !== this ) {

			connections += next.connections;
			next = next.next;

		}

		return connections;

	}

	// add station to linked list of duplicate stations
	linkStation ( station ) {

		if ( this.next ) {

			const oldNext = this.next;

			this.next = station;
			station.next = oldNext;

		} else {

			// note: special case adding to single station.
			// preserves benefit of default null values attached to prototype

			this.next = station;
			station.next = this;

			this.ownType = this.type;

		}

		station.ownType = station.type;

		this.type |= station.type;
		station.type = this.type;

	}

}

StationPosition.prototype.connections = 0;
StationPosition.prototype.splays = 0;
StationPosition.prototype.shortestPath = Infinity;
StationPosition.prototype.children = []; // leaf nodes
StationPosition.prototype.next = null;
StationPosition.prototype.ownType = null;

Object.assign( StationPosition.prototype, Tree.prototype );

export { StationPosition };