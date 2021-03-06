import { EventDispatcher } from '../Three';
import { dataURL } from '../core/lib';

class SurveyMetadata extends EventDispatcher {

	constructor ( name, metadata ) {

		super();

		this.name = name;

		var routes = {};
		var traces = [];
		var entrances = {};

		if ( metadata !== null ) {

			if ( metadata.routes ) routes = metadata.routes;
			if ( metadata.traces ) traces = metadata.traces;
			if ( metadata.entrances ) entrances = metadata.entrances;

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

		}

		this.routes = routes;
		this.traces = traces;
		this.entrances = entrances;

	}

}

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
		entrances: this.entrances
	};

	window.localStorage.setItem( this.name, JSON.stringify( localMetadata ) );

};

SurveyMetadata.prototype.getURL = function () {

	// dump of json top window for cut and paste capture

	return dataURL( {
		name: 'test',
		version: 1.0,
		routes: this.routes,
		traces: this.traces,
		entrances: this.entrances
	} );

};

export { SurveyMetadata };