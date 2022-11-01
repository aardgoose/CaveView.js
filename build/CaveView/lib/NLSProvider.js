
class NLSProvider {

	minZoom = 12;
	maxZoom = 14;

	crsSupported = [ 'EPSG:3857' ];

	coverage = {
		minX: -8,
		minY: 50,
		maxX: 2,
		maxY: 62
	};

	constructor ( key ) {

		this.key = key;

	}

	getUrl ( x, y, z ) {

		return `https://api.maptiler.com/tiles/uk-osgb1919/${z}/${x}/${y}.jpg?key=${this.key}`;

	}

	getAttribution () {

		const a = document.createElement( 'a' );

		a.href = 'http://maps.nls.uk';
		a.textContent = 'map overlay by National Library of Scotland';

		return a;

	}

}
