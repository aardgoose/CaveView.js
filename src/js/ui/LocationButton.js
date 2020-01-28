
function LocationButton ( viewer, container ) { // public method

	var oldButton = document.getElementById( 'cv-gps-button' );

	if ( oldButton !== null ) container.removeChild( oldButton );

	if ( ! viewer.hasLocation ) return;

	var div = document.createElement( 'div' );

	div.id = 'cv-gps-button';

	div.addEventListener( 'click', function () {

		if ( viewer.trackLocation ) {

			div.classList.remove( 'on' );

		} else {

			div.classList.add( 'on' );

		}

		viewer.trackLocation = ! viewer.trackLocation;

	} );

	container.appendChild( div );

}

export { LocationButton };

// EOF