
class BGSProvider {

	crsSupported = [ 'EPSG:3857' ];

	minZoom = 12;
	maxZoom = 14;

	coverage = {
		minX: -8,
		minY: 50,
		maxX: 2,
		maxY: 62
	};


	constructor ( layers ) {

		const styles = [];

		for ( let i = 0; i < layers.length; i++ ) styles.push( 'default' );

		this.layers = '&LAYERS=' + layers.join() + '&STYLES=' + styles.join();

	}

	getUrl ( x, y, z ) {

		const earthRadius = 6378137; // in meters

		const tileCount = Math.pow( 2, z );
		const tileSize = earthRadius * 2 * Math.PI / tileCount;

		x = x - tileCount / 2;
		y = tileCount / 2 - y - 1;

		const x1 = x * tileSize;
		const y1 = y * tileSize;

		const x2 = x1 + tileSize;
		const y2 = y1 + tileSize;

		let imageSize = 256;

		switch ( z ) {

		case 10:

			imageSize = 2048;
			break;

		case 11:

			imageSize = 1024;
			break;

		case 12:

			imageSize = 512;
			break;

		}

		let url = `https://map.bgs.ac.uk/arcgis/services/BGS_Detailed_Geology/MapServer/WMSServer?REQUEST=GetMap&VERSION=1.3.0${this.layers}&FORMAT=image/png&CRS=EPSG:3857`;
		url += `&WIDTH=${imageSize}&HEIGHT=${imageSize}`;
		url += `&BBOX=${x1},${y1},${x2},${y2}`;

		return url;

	}

	getAttribution () {

		const a = document.createElement( 'a' );

		a.href = 'http://www.bgs.ac.uk/data/services/wms.html';
		a.textContent = 'Contains British Geological Survey materials © NERC 2017';

		return a;

	}

}
