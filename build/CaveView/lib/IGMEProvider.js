

function IGMEProvider () {

	this.urlBase = 'http://mapas.igme.es/gis/rest/services/Cartografia_Geologica/IGME_MAGNA_50/MapServer/WMTS?REQUEST=GetTile&SERVICE=WMTS&Version=1.0.0&Layer=Cartografia_Geologica_IGME_MAGNA_50&Style=default&Format=image/png&TileMatrixSet=GoogleMapsCompatible';

}

IGMEProvider.prototype.minZoom = 10;
IGMEProvider.prototype.maxZoom = 18;

/*
NLSProvider.prototype.coverage = {
	minX: -1945261.298110,
	minY: 5414691.645640,
	maxX: 1134858.947510,
	maxY: 10211684.489360
};
*/

IGMEProvider.prototype.getUrl = function ( x, y, z ) {

	return this.urlBase + '&TileMatrix=' + z + '&TileRow=' + y + '&TileCol=' + x;

};

IGMEProvider.prototype.getAttribution = function () {

	var a = document.createElement( 'a' );

	a.href = 'http://maps.nls.uk';
	a.textContent = 'map overlay by National Library of Scotland';

	return a;

};