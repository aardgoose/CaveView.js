
function OSGBStationFormatter ( crs, coordinates, depth, distance ) {

	const easting  = coordinates.x;
	const northing = coordinates.y;

	let prefix = 'STNOH'.charAt( Math.floor( easting / 500000 ) + Math.floor( northing / 500000 ) * 2 );

	const e2 = Math.floor( ( easting  % 500000 ) / 100000 );
	const n2 = Math.floor( ( northing % 500000 ) / 100000 );

	prefix += 'VWXYZQRSTULMNOPFGHJKABCDE'.charAt( e2 + n2 * 5 );

	const e3 = Math.floor( easting  % 100000 ).toLocaleString( 'en-GB', { minimumIntegerDigits: 6, minimumFractionDigits: 2, useGrouping: false } );
	const n3 = Math.floor( northing % 100000 ).toLocaleString( 'en-GB', { minimumIntegerDigits: 6, minimumFractionDigits: 2, useGrouping: false } );

	const lines = [];

	lines.push( `${prefix} ${e3} ${n3}` );
	lines.push( 'height: ' + coordinates.z.toLocaleString( 'en-GB', { maximumFractionDigits: 2, useGrouping: false } ) + '\u202fm' );

	if ( depth !== null ) lines.push( 'depth: ' + depth.toLocaleString( 'en-GB', { maximumFractionDigits: 2, useGrouping: false } ) + '\u202fm' );

	if ( distance !== null ) lines.push( 'distance: ' + distance + '\u202fm' );

	return lines;

}

