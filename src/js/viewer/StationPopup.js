import { Popup } from './Popup.js';


function StationPopup ( station, position, depth ) {

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

	if ( depth !== null ) this.addLine( 'depth from surface: ' + Math.round( depth ) + ' m' );

}

StationPopup.prototype = Object.create( Popup.prototype );

StationPopup.prototype.constructor = StationPopup;

export { StationPopup };