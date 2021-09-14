import { EventDispatcher } from '../Three';
import { dataURL } from '../core/lib';

class SurveyMetadata extends EventDispatcher {

	constructor ( name, metadata ) {

		super();

		this.name = name;

		let routes = {};
		let traces = [];
		let entrances = {};

		if ( metadata !== null ) {

			if ( metadata.routes ) routes = metadata.routes;
			if ( metadata.traces ) traces = metadata.traces;
			if ( metadata.entrances ) entrances = metadata.entrances;

		}

		let localMetadata = window.localStorage.getItem( name );

		if ( localMetadata !== null ) {

			localMetadata = JSON.parse( localMetadata );

			const localRoutes = localMetadata.routes;

			// add local routes to any routes in metadata (if any)

			for ( const routeName in localRoutes ) {

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

	getRoutes () {

		return this.routes;

	}

	saveRoute ( routeName, route ) {

		this.routes[ routeName ] = route;

		this.saveLocal();
		this.dispatchEvent( { name: 'change', type: 'routes' } );

	}

	saveLocal () {

		const localMetadata = {
			routes: this.routes,
			traces: this.traces,
			entrances: this.entrances
		};

		window.localStorage.setItem( this.name, JSON.stringify( localMetadata ) );

	}

	getURL () {

		// dump of json top window for cut and paste capture

		return dataURL( {
			name: 'test',
			version: 1.0,
			routes: this.routes,
			traces: this.traces,
			entrances: this.entrances
		} );

	}

}

export { SurveyMetadata };