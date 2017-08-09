
import { Tree } from '../core/Tree';
import { Box3    } from '../../../../three.js/src/math/Box3';

function RegionHandler ( filename ) {

	this.filename = filename;
	this.box = new Box3();

}

RegionHandler.prototype.constructor = RegionHandler;

RegionHandler.prototype.type = 'json';
RegionHandler.prototype.isRegion = 'true';

RegionHandler.prototype.parse = function ( dataStream ) {

	this.data = dataStream;

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

	this.data.entrances = entrances;
	this.data.surveyTree = new Tree( this.data.title );

};

RegionHandler.prototype.getSurvey = function () {

	return this.data;

};

RegionHandler.prototype.getLimits = function () {

	return this.box;

};

export { RegionHandler };

// EOF