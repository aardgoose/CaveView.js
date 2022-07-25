import { Vector3, EventDispatcher } from './Three';

class LocationSource extends EventDispatcher {

	constructor ( ctx ) {

		super();

		const viewer = ctx.viewer;
		const materials = ctx.materials;

		const location = new Vector3();

		let watcherId = null;
		let survey = null;

		// install hook to track geopgraphical position
		const updateLocation = position => {

			if ( survey === null ) return;

			const coords = position.coords;

			location.set( coords.longitude, coords.latitude, coords.altitude || 0  );

			// move into survey display CRS coordinates

			location.copy( survey.projectionWGS84.forward( location ) );

			// fake altitude for containsPoint check

			if ( location.z == 0 ) location.z = survey.limits.max.z;

			if ( survey.limits.containsPoint( location ) ) {

				// return location in model space

				location.sub ( survey.offsets );

				// if no altitude we do lookup via DTM is a terrain is present

				if ( coords.altitude === null ) {

					if ( survey.terrain ) {

						// FIXME - needs offset?
						location.z = survey.terrain.getHeight( location );
						console.log( location );

					} else {

						location.z = 0;

					}

				}

				this.dispatchEvent( { type: 'location', location: location, survey: survey } );

				if ( watcherId === null ) {

					console.log( 'in survey', location );
					watcherId = navigator.geolocation.watchPosition( updateLocation );

				}

			} else {

				// FIXME - outside survey area
				console.warn( 'outside survey area' );
				this.dispatchEvent( { type: 'invalid' } );

			}

		};

		viewer.addEventListener( 'newCave', event => {

			if ( event.survey !== undefined ) {

				survey = event.survey;
				navigator.geolocation.getCurrentPosition( updateLocation );

			}

		} );

		viewer.addEventListener( 'clear', () => {

			if ( watcherId !== null ) {

				navigator.geolocatoin.clearWatch( watcherId );
				watcherId = null;

			}

			survey = null;
			this.dispatchEvent( { type: 'invalid' } );

		} );

	}

}

class LocationPlugin {

	constructor ( ctx ) {

		if ( ! ( 'geolocation' in navigator ) ) return;

		console.log( 'Location Plugin 0.1' );

		const viewer = ctx.viewer;
		const source = new LocationSource( ctx );

		Object.defineProperties( viewer, {
			'locationSource': {
				get() { return source; }
			}
		} );

	}

}

export { LocationPlugin };