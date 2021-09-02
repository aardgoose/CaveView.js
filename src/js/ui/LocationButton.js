
function LocationButton ( viewer, container ) { // public method

	const oldButtons = container.getElementsByClassName( 'cv-gps-button' ); //FIXME Id can be duplicated

	if ( oldButtons.length !== 0 ) container.removeChild( oldButtons[ 0 ] );

	if ( ! viewer.hasLocation ) return;

	const div = document.createElement( 'div' );

	div.classList.add( 'cv-gps-button' );

	div.addEventListener( 'click', function () {

		if ( viewer.trackLocation ) {

			div.classList.remove( 'on' );

		} else {

			div.classList.add( 'on' );

		}

		viewer.trackLocation = ! viewer.trackLocation;

	} );

	container.appendChild( div );

	this.dispose = function () {

		container.removeChild( div );

	};

}

export { LocationButton };