

function BGSProvider () {
}

BGSProvider.prototype.minZoom = 12;
BGSProvider.prototype.maxZoom = 14;

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

	var url = 'https://map.bgs.ac.uk/arcgis/services/BGS_Detailed_Geology/MapServer/WMSServer?REQUEST=GetMap&VERSION=1.3.0&LAYERS=BGS.50k.Bedrock,BGS.50k.Linear.features&STYLES=default,default&FORMAT=image/png&CRS=EPSG:3857&WIDTH=512&HEIGHT=512';
	var bbox = '&BBOX=' + x1 + ',' + y1 + ',' + x2 + ',' + y2;

	return url + bbox;

};

BGSProvider.prototype.getAttribution = function () {

	var a = document.createElement( 'a' );

	a.href = 'http://www.bgs.ac.uk/data/services/wms.html';
	a.textContent = 'Contains British Geological Survey materials © NERC 2017';

	return a;

};
