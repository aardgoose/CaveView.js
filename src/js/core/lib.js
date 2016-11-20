
function toOSref ( coordinate ) {

	var easting  = coordinate.x;
	var northing = coordinate.y;

	var firstLetter = "STNOH".charAt( Math.floor( easting / 500000 ) + Math.floor( northing / 500000 ) * 2 );

	var e2 = Math.floor( ( easting  % 500000 ) / 100000 );
	var n2 = Math.floor( ( northing % 500000 ) / 100000 );

	var secondLetter = "VWXYZQRSTULMNOPFGHJKABCDE".charAt( e2 + n2 * 5 );

	var e3 = Math.floor( easting  % 100000 ).toLocaleString( "en-GB", { minimumIntegerDigits: 6, useGrouping: false } );
	var n3 = Math.floor( northing % 100000 ).toLocaleString( "en-GB", { minimumIntegerDigits: 6, useGrouping: false } );

	return firstLetter + secondLetter + ' ' + e3 + ' ' + n3;

}


function replaceExtention( fileName, newExtention ) {

	return fileName.split( "." ).shift() + "." + newExtention;

}

function padDigits ( number, digits ) {

	return Array( Math.max( digits - String( number ).length + 1, 0 ) ).join( 0 ) + number;

}

export { toOSref, replaceExtention ,padDigits };

// EOF