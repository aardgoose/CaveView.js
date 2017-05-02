
var environment = new Map();

function setEnvironment ( envs ) {

	var pName;

	for ( pName in envs ) {

		environment.set ( pName , envs[ pName ] );

	}

}

function getEnvironmentValue ( item, defaultValue ) {

	if ( environment.has( item ) ) {

		return environment.get( item );

	} else {

		return defaultValue;

	}

}

function toOSref ( coordinate ) {

	var easting  = coordinate.x;
	var northing = coordinate.y;

	var firstLetter = 'STNOH'.charAt( Math.floor( easting / 500000 ) + Math.floor( northing / 500000 ) * 2 );

	var e2 = Math.floor( ( easting  % 500000 ) / 100000 );
	var n2 = Math.floor( ( northing % 500000 ) / 100000 );

	var secondLetter = 'VWXYZQRSTULMNOPFGHJKABCDE'.charAt( e2 + n2 * 5 );

	var e3 = Math.floor( easting  % 100000 ).toLocaleString( 'en-GB', { minimumIntegerDigits: 6, useGrouping: false } );
	var n3 = Math.floor( northing % 100000 ).toLocaleString( 'en-GB', { minimumIntegerDigits: 6, useGrouping: false } );

	return firstLetter + secondLetter + ' ' + e3 + ' ' + n3;

}


function replaceExtension( fileName, newExtention ) {

	return fileName.split( '.' ).shift() + '.' + newExtention;

}

// polyfill padStart for IE11 - now supported for Chrome, FireFox and Edge

if ( ! String.prototype.padStart ) {

	String.prototype.padStart = function padStart( targetLength, padString ) {

		targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
		padString = String( padString || ' ' );

		if (this.length > targetLength) {

			return String( this );

		} else {

			targetLength = targetLength - this.length;

			if ( targetLength > padString.length ) {

				padString += padString.repeat( targetLength / padString.length ); //append to original to ensure we are longer than needed

			}

			return padString.slice( 0, targetLength ) + String( this );

		}

	};

}

if ( ! String.prototype.repeat ) {

	String.prototype.repeat = function( count ) {

		if ( this == null ) throw new TypeError( 'can\'t convert ' + this + ' to object' );

		var str = '' + this;

		count = +count;

		if ( count != count ) count = 0;

		if ( count < 0 ) throw new RangeError( 'repeat count must be non-negative' );

		if ( count == Infinity ) throw new RangeError( 'repeat count must be less than infinity' );

		count = Math.floor( count );

		if ( str.length == 0 || count == 0 ) return '';

		// Ensuring count is a 31-bit integer allows us to heavily optimize the
		// main part. But anyway, most current (August 2014) browsers can't handle
		// strings 1 << 28 chars or longer, so:

		if ( str.length * count >= 1 << 28 ) throw new RangeError('repeat count must not overflow maximum string size');

		var rpt = '';

		for (;;) {

			if ( ( count & 1) == 1 ) rpt += str;

			count >>>= 1;

			if ( count == 0 ) break;

			str += str;

		}

		// Could we try:
		// return Array(count + 1).join(this);

		return rpt;

	};

}


export { toOSref, replaceExtension, setEnvironment, getEnvironmentValue };

// EOF