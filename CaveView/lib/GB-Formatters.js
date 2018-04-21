
function OSGBStationFormatter ( crs, coordinates, depth, distance ) {

	var easting  = coordinates.x;
	var northing = coordinates.y;

	var firstLetter = 'STNOH'.charAt( Math.floor( easting / 500000 ) + Math.floor( northing / 500000 ) * 2 );

	var e2 = Math.floor( ( easting  % 500000 ) / 100000 );
	var n2 = Math.floor( ( northing % 500000 ) / 100000 );

	var secondLetter = 'VWXYZQRSTULMNOPFGHJKABCDE'.charAt( e2 + n2 * 5 );

	var e3 = Math.floor( easting  % 100000 ).toLocaleString( 'en-GB', { minimumIntegerDigits: 6, minimumFractionDigits: 2, useGrouping: false } );
	var n3 = Math.floor( northing % 100000 ).toLocaleString( 'en-GB', { minimumIntegerDigits: 6, minimumFractionDigits: 2, useGrouping: false } );

	var lines = [];

	lines.push( firstLetter + secondLetter + ' ' + e3 + ' ' + n3 );
	lines.push( 'height: ' + coordinates.z.toLocaleString( 'en-GB', { maximumFractionDigits: 2, useGrouping: false } ) + '\u202fm' );

	if ( depth !== null ) lines.push( 'depth: ' + depth.toLocaleString( 'en-GB', { maximumFractionDigits: 2, useGrouping: false } ) + '\u202fm' );

	if ( distance !== null ) lines.push( 'distance: ' + distance + '\u202fm' );

	return lines;

}

