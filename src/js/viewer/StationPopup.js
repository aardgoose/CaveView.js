import { Popup } from './Popup.js';

function StationPopup ( container, station, survey, depth, formatter ) {

	Popup.call( this );

	const position = survey.getGeographicalPosition( station.p );

	var name = station.getPath();
	var long = false;
	var tmp;
	var lines = null;

	this.container = container;

	// reduce name length if too long

	while ( name.length > 20 ) {

		tmp = name.split( '.' );
		tmp.shift();

		name = tmp.join( '.' );
		long = true;

	}

	if ( long ) name = '...' + name;

	this.addLine( name );

	if ( formatter !== undefined ) {

		lines = formatter( survey.CRS, position, depth );

	}

	if ( lines !== null ) {

		for ( let i = 0; i < lines.length; i++ ) {

			this.addLine( lines[ i ] );

		}

	} else {

		this.addLine( 'x: ' + position.x + ' m' ).addLine( 'y: ' + position.y + ' m' ).addLine( 'z: ' + position.z + ' m' );

		if ( depth !== null ) this.addLine( 'depth from surface: ' + Math.round( depth ) + ' m' );

	}

	this.finish();

	this.position.copy( station.p );

	return this;

}

StationPopup.prototype = Object.create( Popup.prototype );

StationPopup.prototype.constructor = StationPopup;


export { StationPopup };