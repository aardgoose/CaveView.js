

function NLSProvider () {

}

NLSProvider.prototype.minZoom = 12;
NLSProvider.prototype.maxZoom = 14;

NLSProvider.prototype.coverage = {
	minX: -1945261.298110,
	minY: 5414691.645640,
	maxX: 1134858.947510,
	maxY: 10211684.489360
};

NLSProvider.prototype.getUrl = function ( x, y, z ) {

	return NLSTileUrlOS( x, y, z );

};

NLSProvider.prototype.getAttribution = function () {

	var a = document.createElement( 'a' );

	a.href = 'http://maps.nls.uk';
	a.textContent = 'map overlay by National Library of Scotland';

	return a;

};