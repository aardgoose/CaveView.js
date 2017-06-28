
function BGSTileURL ( x, y, z ) {

	var earthRadius = 6378137; // in meters

	var tileCount = Math.pow( 2, z );
	var tileSize = earthRadius * 2 * Math.PI / tileCount;

	var x1, x2, y1, y2;

	x = x - tileCount / 2;
	y = tileCount / 2 - y;

	x1 = x * tileSize;
	y1 = y * tileSize;

	x2 = x1 + tileSize;
	y2 = y1 + tileSize;


	var url = 'https://map.bgs.ac.uk/arcgis/services/BGS_Detailed_Geology/MapServer/WMSServer?REQUEST=GetMap&VERSION=1.3.0&LAYERS=BGS.50k.Bedrock&STYLES=default&FORMAT=image/png&CRS=EPSG:3857&WIDTH=450&HEIGHT=450';
	var bbox = '&BBOX=' + x1 + ',' + y1 + ',' + x2 + ',' + y2;

	console.log( 'BGS: ', bbox );

//	var img = document.createElement( 'img' );

//	img.src = url + bbox;
//	img.crossOrigin = '';

//	document.body.appendChild( img );

	return url + bbox;

}