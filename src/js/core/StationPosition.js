// extend Vector3 to add methods to calculate lengths corrected for distortions introduced
// by web mercator projection and add connection count

import { Vector3 } from '../Three.js';

class StationPosition extends Vector3 {

	constructor( x, y, z ) {

		super( x, y, z );

	}

	correctedDistanceTo ( v ) {

		return Math.sqrt( this.correctedDistanceToSquared( v ) );

	}

	correctedDistanceToSquared ( v ) {

		const dx = this.x - v.x, dy = this.y - v.y, dz = ( this.z - v.z ) * StationPosition.scaleFactor;

		return dx * dx + dy * dy + dz * dz;

	}

}

StationPosition.scaleFactor = 1;

StationPosition.prototype.connections = 0;
StationPosition.prototype.splays = 0;
StationPosition.prototype.shortestPath = Infinity;

export { StationPosition };