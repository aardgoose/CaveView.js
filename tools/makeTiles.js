"use strict";

var halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition
var mapSet = 'UK';

function tileArea( x, y, z, maxZoom ) {

	var x1, y1, z1;
	var tileWidth = halfMapExtent / Math.pow( 2, z - 1 );
	var resolution = tileWidth / 128; // note: tile area extended by resolution / 2 all round givving 256 sample row & columns
	var offset = resolution / 2;

	var n, s, e, w;
	var cmd;

	n = halfMapExtent - y * tileWidth + offset;
	s = halfMapExtent - ( y + 1 ) * tileWidth - offset

	w = - halfMapExtent + x * tileWidth - offset;
	e = - halfMapExtent + ( x + 1 ) * tileWidth + offset

	//console.log( 'create tile: [', x, ',', y , '] @ zoom ' + z + ' width:', tileWidth );

	if ( z > 8 ) {

		cmd =  'g.region n=' + n + ' s=' + s + ' w=' +  w + ' e=' + e + ' nsres=' + resolution + ' ewres=' + resolution;
		console.log( cmd );

		outFile = 'dtm\\' + z + '\\DTM-' + x + "-" + y + '.bin';

		cmd = 'r.out.bin -b bytes=2 input=DTM' + z + 'X@' + mapSet +  ' output=' + outFile;
		console.log( cmd );

	}

	if ( z < maxZoom ) {

		x1 = x * 2;
		y1 = y * 2;
		z1 = z + 1;

		tileArea( x1,     y1,     z1, maxZoom );
		tileArea( x1 + 1, y1,     z1, maxZoom );
		tileArea( x1,     y1 + 1, z1, maxZoom );
		tileArea( x1 + 1, y1 + 1, z1, maxZoom );

	}

}


// EPSG:3875 "Web Mercator" tile range

var tileSet = {
		title: 'Dales 1',
		dtmMaxZoom: 13,
		zoomMax: 18,
		zoomMin: 10,
		divisions: 128,
		directory: '',
		subdirectory: 'dales1',
		dtmScale: 64,
		minX: 504,
		maxX: 505,
		minY: 327,
		maxY: 327
	};

var x, y, outFile, cmd;
var n, s, e, w;

for ( x = tileSet.minX; x <= tileSet.maxX; x++ ) {

	for ( y = tileSet.minY; y <= tileSet.maxY; y++ ) {

		tileArea( x, y, tileSet.zoomMin, tileSet.dtmMaxZoom );

	}

}

