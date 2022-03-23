
class OSMProvider {

	crsSupported = [ 'EPSG:3857' ];

	getUrl ( x, y, z ) {

		return `https://b.tile.openstreetmap.org/${z}/${x}/${y}.png`;

	}

	getAttribution () {

		const a = document.createElement( 'a' );

		a.textContent = '© OpenStreetMap contributors';
		a.href = 'http://www.openstreetmap.org/copyright';

		return a;

	}

}
