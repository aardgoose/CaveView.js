

function WMTSProvider () {

//	this.urlBase = 'http://www.ign.es/wmts/mapa-raster?REQUEST=GetTile&SERVICE=WMTS&Version=1.0.0&Layer=MTN&Style=default&Format=image/jpeg&TileMatrixSet=GoogleMapsCompatible';
	this.urlBase = 'http://www.ign.es/wmts/pnoa-ma?REQUEST=GetTile&SERVICE=WMTS&Version=1.0.0&Layer=OI.OrthoimageCoverage&Style=default&Format=image/jpeg&TileMatrixSet=GoogleMapsCompatible';

}

WMTSProvider.prototype.minZoom = 10;
WMTSProvider.prototype.maxZoom = 20;

/*
NLSProvider.prototype.coverage = {
	minX: -1945261.298110,
	minY: 5414691.645640,
	maxX: 1134858.947510,
	maxY: 10211684.489360
};
*/

WMTSProvider.prototype.getUrl = function ( x, y, z ) {

	return this.urlBase + '&TileMatrix=' + z + '&TileRow=' + y + '&TileCol=' + x;

};

WMTSProvider.prototype.getAttribution = function () {

	var a = document.createElement( 'a' );

	a.href = 'http://maps.nls.uk';
	a.textContent = 'map overlay by National Library of Scotland';

	return a;

};