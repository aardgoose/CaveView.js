

function WMTSProvider ( overlayMap ) {

	if ( overlayMap ) {

		// conventional mapping

		this.urlBase = 'https://www.ign.es/wmts/mapa-raster?REQUEST=GetTile&SERVICE=WMTS&Version=1.0.0&Layer=MTN&Style=default&Format=image/jpeg';

	} else {

		// aerial photography

		this.urlBase = 'https://www.ign.es/wmts/pnoa-ma?REQUEST=GetTile&SERVICE=WMTS&Version=1.0.0&Layer=OI.OrthoimageCoverage&Style=default&Format=image/jpeg';

	}

}

WMTSProvider.prototype.minZoom = 10;
WMTSProvider.prototype.maxZoom = 20;

WMTSProvider.prototype.coverage = {
	minX: -9.39288367353,
	minY: 35.946850084,
	maxX: 3.03948408368,
	maxY: 43.7483377142
};

WMTSProvider.prototype.getUrl = function ( x, y, z ) {

	var tileMatrixSet;
	var tileMatrixPrefix;

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

	return this.urlBase + '&TileMatrixSet=' + tileMatrixSet + '&TileMatrix=' + tileMatrixPrefix + z + '&TileRow=' + y + '&TileCol=' + x;

};

WMTSProvider.prototype.getAttribution = function () {

	var a = document.createElement( 'a' );

	a.href = 'http://www.ign.es/';
	a.textContent = 'overlays © Instituto Geográfico Nacional de España';

	return a;

};