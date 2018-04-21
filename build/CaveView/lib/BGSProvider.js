

function BGSProvider ( layers ) {

	var styles = [];

	for ( var i = 0; i < layers.length; i++ ) styles.push( 'default' );

	this.layers = '&LAYERS=' + layers.join() + '&STYLES=' + styles.join();

}

BGSProvider.prototype.minZoom = 12;
BGSProvider.prototype.maxZoom = 14;

BGSProvider.prototype.coverage = {
	minX: -1945261.298110,
	minY: 5414691.645640,
	maxX: 1134858.947510,
	maxY: 10211684.489360
};

BGSProvider.prototype.getUrl = function ( x, y, z ) {

	var earthRadius = 6378137; // in meters

	var tileCount = Math.pow( 2, z );
	var tileSize = earthRadius * 2 * Math.PI / tileCount;

	var x1, x2, y1, y2;

	x = x - tileCount / 2;
	y = tileCount / 2 - y - 1;

	x1 = x * tileSize;
	y1 = y * tileSize;

	x2 = x1 + tileSize;
	y2 = y1 + tileSize;

	var imageSize = 256;

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

	var url = 'https://map.bgs.ac.uk/arcgis/services/BGS_Detailed_Geology/MapServer/WMSServer?REQUEST=GetMap&VERSION=1.3.0' + this.layers + '&FORMAT=image/png&CRS=EPSG:3857';
	var size = '&WIDTH=' + imageSize + '&HEIGHT=' + imageSize;
	var bbox = '&BBOX=' + x1 + ',' + y1 + ',' + x2 + ',' + y2;

	return url + size + bbox;

};

BGSProvider.prototype.getAttribution = function () {

	var a = document.createElement( 'a' );

	a.href = 'http://www.bgs.ac.uk/data/services/wms.html';
	a.textContent = 'Contains British Geological Survey materials © NERC 2017';

	return a;

};
