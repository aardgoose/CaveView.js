// extend Vector3 to add methods to calculate lengths corrected for distortions introduced
// by web mercator projection and add connection count

import { Vector3 } from '../Three.js';

function StationPosition ( x, y, z ) {

	Vector3.call( this, x, y, z );

}

StationPosition.scaleFactor = 1;

Object.assign( StationPosition.prototype, Vector3.prototype );

StationPosition.prototype.connections = 0;

StationPosition.prototype.correctedDistanceTo = function ( v ) {

	return Math.sqrt( this.correctedDistanceToSquared( v ) );

};

StationPosition.prototype.correctedDistanceToSquared = function ( v ) {

	var dx = this.x - v.x, dy = this.y - v.y, dz = ( this.z - v.z ) * StationPosition.scaleFactor;

	return dx * dx + dy * dy + dz * dz;

};

export { StationPosition };
