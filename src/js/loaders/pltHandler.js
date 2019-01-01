
import { LEG_CAVE, STATION_NORMAL } from '../core/constants';
import { Tree } from '../core/Tree';
import { Vector3, Box3 } from '../Three';
import { StationPosition } from '../core/StationPosition';

function pltHandler ( fileName ) {

	this.fileName     = fileName;
	this.scraps       = [];
	this.faults       = [];
	this.groups       = [];
	this.xGroups      = [];
	this.xSects       = [];
	this.allStations  = [];
	this.surveyTree   = new Tree( '', 0 );
	this.limits       = new Box3();
	this.terrains     = [];
	this.hasTerrain   = false;
	this.modelOffset  = 0;
	this.messages     = 0;

}

pltHandler.prototype.constructor = pltHandler;

pltHandler.prototype.type = 'text';

pltHandler.prototype.parse = function ( dataStream, metadata, section ) {

	this.metadata = metadata;

	const groups     = this.groups;
	const surveyTree = this.surveyTree;
	const xSects     = this.xSects;
	const limits     = this.limits;
	const stationMap = new Map();
	const allStations = this.allStations;

	var path = [];
	var segments = [];
	var stationName;
	var surveyName;
	var surveyId = 0;

	const lines = dataStream.split( /[\n\r]+/ );

	const l = lines.length;
	var i;

	for ( i = 0; i < l; i++ ) {

		const parts = lines[ i ].split( /\s+/ );

		const cmd = parts[ 0 ].charAt( 0 );

		switch ( cmd ) {

		case 'M': // move

			if ( segments.length > 1 ) groups.push( segments );

			segments = [];

		case 'D': // eslint-disable-line no-fallthrough

			var coords = readCoords( parts );

			stationName = parts[ 4 ].substring( 1 );

			segments.push( { coords: coords, type: LEG_CAVE, survey: surveyId } );

			path[ 1 ] = stationName;

			surveyTree.addLeaf( path, { p: coords, type: STATION_NORMAL } );

			console.log( 'sname', stationName );

			break;

		case 'N': // line survey

			surveyName = parts[ 0 ].substring( 1 );

			console.log( 'survey', surveyName );
			path = [ surveyName ];
			surveyId = surveyTree.addPath( surveyName ).id;

			break;

		case 'Z': // end of survey

			limits.min.set(
				+parts[ 3 ],
				+parts[ 1 ],
				+parts[ 5 ]
			);

			limits.max.set(
				+parts[ 4 ],
				+parts[ 2 ],
				+parts[ 6 ]
			);

			console.log( 'limits ', limits );

			break;

		case 'F': // feature survey
		case 'L': // feature location
		case 'X': // end of survey
		case 'O': // Datum
		case 'G': // UTM Zone

			break;

		case 'S':

			console.log( 'section name', lines[ 1 ].substring( 1 ) );
			break;

		default:

			console.log( 'unknown command ', parts[ 0 ] );

		}

	}

	if ( segments.length > 1 ) groups.push( segments );

	return this;

	function readCoords( parts ) {

		const lastKey = parts[ 1 ] + ':' + parts[ 2 ] + ':' + parts[ 3 ];
		const cachedCoords = stationMap.get( lastKey );

		var coords;

		if ( cachedCoords !== undefined ) {

			coords = cachedCoords;

		} else {

			coords = new StationPosition(
				+parts[ 2 ],
				+parts[ 1 ],
				+parts[ 3 ]
			);

			stationMap.set( lastKey, coords );
			allStations.push( coords );

		}

		return coords;

	}

};

pltHandler.prototype.getLineSegments = function () {

	const lineSegments = [];
	const groups = this.groups;

	for ( var i = 0, l = groups.length; i < l; i++ ) {

		const g = groups[ i ];

		for ( var v = 0, vMax = g.length - 1; v < vMax; v++ ) {

			// create vertex pairs for each line segment.
			// all vertices except first and last are duplicated.
			const from = g[ v ];
			const to   = g[ v + 1 ];

			const fromCoords = from.coords;
			const toCoords = to.coords;

			lineSegments.push( { from: fromCoords, to: toCoords, type: to.type, survey: to.survey } );

		}

	}

	return lineSegments;

};

pltHandler.prototype.end = function () {

	const allStations = this.allStations;
	const offsets = this.limits.getCenter( new Vector3() );

	this.offsets = offsets;

	// convert to origin centered coordinates

	allStations.forEach( function ( s ) {

		s.sub( offsets );

	} );

	console.log( this.surveyTree );

	return this;

};

pltHandler.prototype.getSurvey = function () {

	return {
		title: this.fileName,
		surveyTree: this.surveyTree,
		sourceCRS: null,
		targetCRS: null,
		lineSegments: this.getLineSegments(),
		crossSections: this.xGroups,
		scraps: [],
		hasTerrain: false,
		metadata: this.metadata,
		limits: this.limits,
		offsets: this.offsets
	};

};

export { pltHandler };

// EOF