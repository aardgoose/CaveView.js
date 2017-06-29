function SurveyMetadata( name, metadata ) {

	this.name = name;

	var routes = {};
	var traces = [];

	if ( metadata !== null ) {

		if ( metadata.routes ) routes = metadata.routes;
		if ( metadata.traces ) traces = metadata.traces;

	}

	var localMetadata = localStorage.getItem( name );

	if ( localMetadata !== null ) {

		localMetadata = JSON.parse( localMetadata );

		var localRoutes = localMetadata.routes;
		var routeName, route;

		// add local routes to any routes in metadata (if any)

		for ( routeName in localRoutes ) {

			route = localRoutes[ routeName ];
			route.local = true;

			routes[ routeName ] = route;

		}

	}

	this.routes = routes;
	this.traces = traces;

}

SurveyMetadata.prototype.constructor = SurveyMetadata;

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

	var localMetadata = { routes: this.routes, traces: this.traces };

	localStorage.setItem( this.name, JSON.stringify( localMetadata ) );

};

SurveyMetadata.prototype.toDownload = function () {

	// dump of json top window for cut and paste capture

	var routesJSON = {
		name: 'test',
		version: 1.0,
		routes: this.routes,
		traces: this.traces
	};

	return 'data:text/json;charset=utf8,' + encodeURIComponent( JSON.stringify( routesJSON ) );

};

export { SurveyMetadata };