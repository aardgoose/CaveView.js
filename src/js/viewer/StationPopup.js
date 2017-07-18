import { Popup } from './Popup.js';


function StationPopup ( station, position ) {

	Popup.call( this, 'station-info' );

	var name = station.getPath();
	var long = false;
	var tmp;

	// reduce name length if too long

	while ( name.length > 20 ) {

		tmp = name.split( '.' );
		tmp.shift();

		name = tmp.join( '.' );
		long = true;

	}

	if ( long ) name = '...' + name;

	this.addLine( name );
	this.addLine( 'x: ' + position.x + ' m' ).addLine( 'y: ' + position.y + ' m' ).addLine( 'z: ' + position.z + ' m' );

}

StationPopup.prototype = Object.create( Popup.prototype );

StationPopup.prototype.constructor = StationPopup;

export { StationPopup };