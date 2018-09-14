
import { EventDispatcher } from '../Three';

function SurveyMetadata( name, metadata ) {

	this.name = name;

	var routes = {};
	var traces = [];
	var entrances = {};
	var annotations = {};

	if ( metadata !== null ) {

		if ( metadata.routes ) routes = metadata.routes;
		if ( metadata.traces ) traces = metadata.traces;
		if ( metadata.entrances ) entrances = metadata.entrances;
		if ( metadata.annotations ) annotations = metadata.annotations;

	}

	var localMetadata = window.localStorage.getItem( name );

	if ( localMetadata !== null ) {

		localMetadata = JSON.parse( localMetadata );

		const localRoutes = localMetadata.routes;

		// add local routes to any routes in metadata (if any)
		var routeName;

		for ( routeName in localRoutes ) {

			const route = localRoutes[ routeName ];
			route.local = true;

			routes[ routeName ] = route;

		}

		if ( localMetadata.traces !== undefined ) traces = localMetadata.traces; // FIXME - merge with preexisting
		if ( localMetadata.entrances !== undefined ) entrances = localMetadata.entrances;
		if ( localMetadata.annotations !== undefined ) annotations = localMetadata.annotations;

	}

	this.routes = routes;
	this.traces = traces;
	this.entrances = entrances;
	this.annotations = annotations;

}

SurveyMetadata.annotators = {};

SurveyMetadata.addAnnotator = function ( annotator ) {

	console.log( annotator );
	SurveyMetadata.annotators[ annotator.name ] = annotator;

};

SurveyMetadata.prototype = Object.create( EventDispatcher.prototype );


SurveyMetadata.prototype.getRoutes = function () {

	return this.routes;

};

SurveyMetadata.prototype.saveRoute = function ( routeName, route ) {

	this.routes[ routeName ] = route;

	this.saveLocal();
	this.dispatchEvent( { name: 'change', type: 'routes' } );

};

SurveyMetadata.prototype.saveLocal = function () {

	const localMetadata = {
		routes: this.routes,
		traces: this.traces,
		entrances: this.entrances,
		annotations: this.annotations
	};

	window.localStorage.setItem( this.name, JSON.stringify( localMetadata ) );

};

SurveyMetadata.prototype.getURL = function () {

	// dump of json top window for cut and paste capture

	const routesJSON = {
		name: 'test',
		version: 1.0,
		routes: this.routes,
		traces: this.traces,
		entrances: this.entrances,
		annotations: this.annotations
	};

	return 'data:text/json;charset=utf8,' + encodeURIComponent( JSON.stringify( routesJSON ) );

};

export { SurveyMetadata };