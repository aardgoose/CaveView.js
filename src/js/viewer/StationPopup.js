import { Popup } from './Popup.js';


function StationPopup ( station ) {

	Popup.call( this, 'station-info' );

	var point = station.p;
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
	this.addLine( 'x: ' + point.x + ' m' ).addLine( 'y: ' + point.y + ' m' ).addLine( 'z: ' + point.z + ' m' );

}

StationPopup.prototype = Object.create( Popup.prototype );

StationPopup.prototype.constructor = StationPopup;

export { StationPopup }