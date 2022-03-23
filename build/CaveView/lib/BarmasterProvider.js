
class BarmasterProvider {

	minZoom = 12;
	maxZoom = 15;

	crsSupported = [ 'EPSG:3857' ];

	coverage = {
		minX: -8,
		minY: 50,
		maxX: 2,
		maxY: 62
	};

	getUrl ( x, y, z ) {

		return `overlays/barmaster/${z}/${x}/${y}.png`;

	}

	getAttribution () {

		const a = document.createElement( 'div' );
		a.textContent = 'Barmaster maps';

		return a;

	}

}
