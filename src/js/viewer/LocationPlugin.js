
import { Vector3 } from '../Three';

class LocationPlugin {

	constructor ( ctx ) {

		if ( ! ( 'geolocation' in navigator ) ) return;

		console.log( 'Location Plugin 0.1' );

		const viewer = ctx.viewer;
		const location = new Vector3();

		let watcherId = null;


		let survey = null;

		// install hook to track geopgraphical position

		viewer.addEventListener( 'newCave', event => {

			survey = event.survey;

			navigator.geolocation.getCurrentPosition( updateLocation );

		} );

		viewer.addEventListener( 'clear', () => {

			if ( watcherId !== null ) {

				navigator.geolocatoin.clearWatch( watcherId );
				watcherId = null;

			}

			survey = null;

		} );

		Object.defineProperties( viewer, {
			'hasLocation': {
				get() { return watcherId !== null; }
			},
			'location': {
				get() { return location; }
			}
		} );

		function updateLocation ( position ) {

			const coords = position.coords;

			location.set( coords.longitude, coords.latitude, coords.altitude || 0  );

			// move into survey display CRS coordinates

			location.copy( survey.projectionWGS84.forward( location ) );
//			location.sub ( survey.offsets );
//			location.divide( survey.modelLimits.max );

			// FIXME - if no altitude do we do lookup via DTM is a terrain is present

			if ( location.z == 0 ) location.z = survey.limits.max.z;

			if ( survey.limits.containsPoint( location ) ) {

				if ( watcherId === null ) {

					console.log( 'in survey', location );
					watcherId = navigator.geolocation.watchPosition( updateLocation );


				}

			} else {

				// FIXME - outside survey area
				console.warn( 'outside survey area' );

			}

		}

	}

}

export { LocationPlugin };