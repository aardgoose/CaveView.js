import { Viewer } from '../viewer/Viewer';

function GPSButton ( container ) { // public method

	var oldButton = document.getElementById( 'cv-gps-button' );

	if ( oldButton !== null ) container.removeChild( oldButton );

	if ( ! Viewer.hasGPS ) return;

	var div = document.createElement( 'div' );

	div.id = 'cv-gps-button';

	div.addEventListener( 'click', function () {

		if ( Viewer.trackGPS ) {

			div.classList.remove( 'on' );

		} else {

			div.classList.add( 'on' );

		}

		Viewer.trackGPS = ! Viewer.trackGPS;

	} );

	container.appendChild( div );

}

export { GPSButton };

// EOF