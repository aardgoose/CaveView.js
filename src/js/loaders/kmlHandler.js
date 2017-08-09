// Survex kml file handler

//import { LEG_CAVE, LEG_SPLAY, LEG_SURFACE, STATION_NORMAL, STATION_ENTRANCE } from '../core/constants';
import { Tree } from '../core/Tree';

function kmlHandler ( fileName ) {

	this.fileName   = fileName;
	this.groups     = [];
	this.surface    = [];
	this.xGroups    = [];
	this.surveyTree = new Tree();
	this.sourceCRS  = null;
	this.targetCRS  = 'EPSG:3857'; // "web mercator"
	this.projection = null;

}

kmlHandler.prototype.constructor = kmlHandler;

kmlHandler.prototype.type = 'document';
kmlHandler.prototype.isRegion = 'false';
kmlHandler.prototype.mimeType = 'text/xml';

kmlHandler.prototype.parse = function ( dataStream, metadata ) {

	this.metadata = metadata;

	console.log( 'x', dataStream );
	for ( var n in dataStream ) {

		console.log( ':', n );

	}

	return this;

};


kmlHandler.prototype.getLineSegments = function () {

	var lineSegments = [];
	var groups = this.groups;
	var offsets = this.offsets;

	for ( var i = 0, l = groups.length; i < l; i++ ) {

		var g = groups[ i ];

		for ( var v = 0, vMax = g.length - 1; v < vMax; v++ ) {

			// create vertex pairs for each line segment.
			// all vertices except first and last are duplicated.
			var from = g[ v ];
			var to   = g[ v + 1 ];


			// move coordinates around origin

			from.coords.x -= offsets.x;
			from.coords.y -= offsets.y;
			from.coords.z -= offsets.z;

			var fromCoords = from.coords;
			var toCoords = to.coords;

			// skip repeated points ( co-located stations )
			if ( fromCoords.x === toCoords.x && fromCoords.y === toCoords.y && fromCoords.z === toCoords.z ) continue;

			lineSegments.push( { from: fromCoords, to: toCoords, type: to.type, survey: to.survey } );

		}

		// move coordinates around origin

		to.coords.x -= offsets.x;
		to.coords.y -= offsets.y;
		to.coords.z -= offsets.z;

	}

	return lineSegments;

};

kmlHandler.prototype.getTerrainDimensions = function () {

	return { lines: 0, samples: 0 };

};

kmlHandler.prototype.getTerrainBitmap = function () {

	return false;

};

kmlHandler.prototype.getSurvey = function () {

	return {
		title: this.fileName,
		surveyTree: this.surveyTree,
		sourceCRS: this.sourceCRS,
		targetCRS: this.targetCRS,
		limits: this.limits,
		offsets: this.offsets,
		lineSegments: this.getLineSegments(),
		crossSections: this.xGroups,
		scraps: [],
		hasTerrain: false,
		metadata: this.metadata
	};

};

export { kmlHandler };

// EOF