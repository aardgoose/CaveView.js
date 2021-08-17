var scope;

if ( self ) {
	scope = self;
} else {
	scope = window;
}

if ( scope.TextDecoder === undefined ) {

	var TextDecoder = function () {};

	TextDecoder.prototype.decode = function ( bytes ) {

		const l = bytes.length;

		let encoded = '';

		for ( let i = 0; i < l; i++ ) {

			encoded += '%' + bytes[ i ].toString( 16 );

		}

		return decodeURIComponent( encoded );


	};

	scope.TextDecoder = TextDecoder;

}