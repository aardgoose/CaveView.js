
// polyfill padStart for IE11 - now supported for Chrome, FireFox and Edge
if ( Math.log2 === undefined ) {

	// Missing in IE
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log2

	Math.log2 = function ( value ) {

		return Math.log( value ) * Math.LOG2E;

	};

}

// https://tc39.github.io/ecma262/#sec-array.prototype.find
if ( ! Array.prototype.find ) {

	Object.defineProperty( Array.prototype, 'find', {
		value: function( predicate ) {

			// 1. Let O be ? ToObject(this value).
			if ( this == null ) {
				throw new TypeError( '"this" is null or not defined' );
			}

			var o = Object( this );

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// 3. If IsCallable(predicate) is false, throw a TypeError exception.
			if ( typeof predicate !== 'function' ) {
				throw new TypeError( 'predicate must be a function' );
			}

			// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
			var thisArg = arguments[ 1 ];

			// 5. Let k be 0.
			var k = 0;

			// 6. Repeat, while k < len
			while ( k < len ) {

				// a. Let Pk be ! ToString(k).
				// b. Let kValue be ? Get(O, Pk).
				// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
				// d. If testResult is true, return kValue.

				var kValue = o[ k ];
				if ( predicate.call( thisArg, kValue, k, o ) ) {

					return kValue;

				}

				// e. Increase k by 1.
				k++;
			}

			// 7. Return undefined.
			return undefined;
		},
		configurable: true,
		writable: true
	} );
}

if ( ! String.prototype.startsWith ) {

	String.prototype.startsWith = function( searchString, position ) {

		return this.substr( position || 0, searchString.length ) === searchString;

	};

}

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

if ( window.TextDecoder === undefined ) {

	var TextDecoder = function () {};

	TextDecoder.prototype.decode = function ( bytes ) {

		const l = bytes.length;

		var encoded = '';

		for ( var i = 0; i < l; i++ ) {

			encoded += '%' + bytes[ i ].toString(16);

		}

		return decodeURIComponent( encoded );


	};

	window.TextDecoder = TextDecoder;

}

if ( ! Float32Array.prototype.fill) {

	Float32Array.prototype.fill = Array.prototype.fill;

}

// EOF