
import { getEnvironmentValue } from '../core/constants.js';
import { Box3, Vector3 } from '../../../../three.js/src/Three.js';

function RegionHandler ( filename, dataStream ) {

	this.isRegion = true;
	this.data = dataStream;
	this.box = new Box3();

}

RegionHandler.prototype.constructor = RegionHandler;

RegionHandler.prototype.getData = function () {

	return this.data;

}

RegionHandler.prototype.getEntrances = function () {

	var entrances = [];
	var caves = this.data.caves;
	var caveName;

	var min = this.box.min;
	var max = this.box.max;

	for ( caveName in caves ) {

		var i;
		var e = caves[ caveName ].entrances;

		for ( i = 0; i < e.length; i++ ) {

			var entrance = e[ i ];

			min.min( entrance.position );
			max.max( entrance.position );

			entrances.push( entrance );

		}

	}

	return entrances;

}

RegionHandler.prototype.getName = function () {

	return this.data.title;

}

RegionHandler.prototype.getLimits = function () {

	return this.box;

}

export { RegionHandler };

// EOF