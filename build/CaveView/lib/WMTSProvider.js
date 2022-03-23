
class WMTSProvider {

	minZoom = 10;
	maxZoom = 20;

	coverage = {
		minX: -9.39288367353,
		minY: 35.946850084,
		maxX: 3.03948408368,
		maxY: 43.7483377142
	};

	constructor ( overlayMap ) {

		if ( overlayMap ) {

			// conventional mapping
			this.urlBase = 'http://www.ign.es/wmts/mapa-raster?REQUEST=GetTile&SERVICE=WMTS&Version=1.0.0&Layer=MTN&Style=default&Format=image/jpeg';

		} else {

			// aerial photography

			this.urlBase = 'http://www.ign.es/wmts/pnoa-ma?REQUEST=GetTile&SERVICE=WMTS&Version=1.0.0&Layer=OI.OrthoimageCoverage&Style=default&Format=image/jpeg';

		}

	}


	getUrl ( x, y, z ) {

		let tileMatrixSet;
		let tileMatrixPrefix;

		switch ( this.crs ) {

		case 'EPSG:4326':
		case 'ORIGINAL':

			tileMatrixSet = 'EPSG:4326';
			tileMatrixPrefix = 'EPSG:4326:';
			y = Math.pow( 2, z ) - y - 1;

			break;

		default:

			tileMatrixSet = 'GoogleMapsCompatible';
			tileMatrixPrefix = '';

		}

		return `${this.urlBase}&TileMatrixSet=${tileMatrixSet}&TileMatrix=${tileMatrixPrefix}${z}&TileRow=${y}&TileCol=${x}`;

	}

	getAttribution () {

		const a = document.createElement( 'a' );

		a.href = 'http://maps.nls.uk';
		a.textContent = 'map overlay by National Library of Scotland';

		return a;

	}

}
