

function NLSProvider () {

}

NLSProvider.prototype.getUrl = function ( x, y, z ) {

	return NLSTileUrlOS( x, y, z );

}

NLSProvider.prototype.getAttribution = function () {

	var a = document.createElement( 'a' );

	a.href = 'http://maps.nls.uk';
	a.textContent = 'map overlay by National Library of Scotland';

	return a;

}