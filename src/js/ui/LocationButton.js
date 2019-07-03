import { Viewer } from '../viewer/Viewer';

function LocationButton ( container ) { // public method

	var oldButton = document.getElementById( 'cv-gps-button' );

	if ( oldButton !== null ) container.removeChild( oldButton );

	if ( ! Viewer.hasLocation ) return;

	var div = document.createElement( 'div' );

	div.id = 'cv-gps-button';

	div.addEventListener( 'click', function () {

		if ( Viewer.trackLocation ) {

			div.classList.remove( 'on' );

		} else {

			div.classList.add( 'on' );

		}

		Viewer.trackLocation = ! Viewer.trackLocation;

	} );

	container.appendChild( div );

}

export { LocationButton };

// EOF