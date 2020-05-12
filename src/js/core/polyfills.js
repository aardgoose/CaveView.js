
if ( window.TextDecoder === undefined ) {

	var TextDecoder = function () {};

	TextDecoder.prototype.decode = function ( bytes ) {

		const l = bytes.length;

		var encoded = '';

		for ( var i = 0; i < l; i++ ) {

			encoded += '%' + bytes[ i ].toString( 16 );

		}

		return decodeURIComponent( encoded );


	};

	window.TextDecoder = TextDecoder;

}