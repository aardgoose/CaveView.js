function SurveyMetadata( name, metadata ) {

	this.name = name;

	var routes = {};
	var traces = [];
	var entrances = {};

	if ( metadata !== null ) {

		if ( metadata.routes ) routes = metadata.routes;
		if ( metadata.traces ) traces = metadata.traces;
		if ( metadata.entrances ) entrances = metadata.entrances;

	}

	var localMetadata = Window.localStorage.getItem( name );

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

	}

	this.routes = routes;
	this.traces = traces;
	this.entrances = entrances;

}

SurveyMetadata.prototype.getTraces = function () {

	return this.traces;

};

SurveyMetadata.prototype.getRoutes = function () {

	return this.routes;

};

SurveyMetadata.prototype.saveRoute = function ( routeName, route ) {

	this.routes[ routeName ] = route;

	this.saveLocal();

};

SurveyMetadata.prototype.saveLocal = function () {

	const localMetadata = {
		routes: this.routes,
		traces: this.traces,
		entrances: this.entrances
	};

	Window.localStorage.setItem( this.name, JSON.stringify( localMetadata ) );

};

SurveyMetadata.prototype.getURL = function () {

	// dump of json top window for cut and paste capture

	const routesJSON = {
		name: 'test',
		version: 1.0,
		routes: this.routes,
		traces: this.traces
	};

	return 'data:text/json;charset=utf8,' + encodeURIComponent( JSON.stringify( routesJSON ) );

};

export { SurveyMetadata };