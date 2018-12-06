

function BarmasterProvider () {

}

BarmasterProvider.prototype.minZoom = 12;
BarmasterProvider.prototype.maxZoom = 15;

BarmasterProvider.prototype.crsSupported = [ 'EPSG:3857' ];

BarmasterProvider.prototype.coverage = {
	minX: -8,
	minY: 50,
	maxX: 2,
	maxY: 62
};

BarmasterProvider.prototype.getUrl = function ( x, y, z ) {

	return 'overlays/barmaster/' + z + '/' + x + '/' + y + '.png';

};

BarmasterProvider.prototype.getAttribution = function () {

	var a = document.createElement( 'div' );

	a.textContent = 'Barmaster maps';

	return a;

};