'use strict';

const { execSync } = require( 'child_process' );

const halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition

function runCmd( cmd ) {

	console.log( cmd );
	execSync( cmd );

}

function tileArea( x, y, z, maxZoom ) {

	var x1, y1, z1;
	var tileWidth = halfMapExtent / Math.pow( 2, z - 1 );
	var resolution = tileWidth / 128; // note: tile area extended by resolution / 2 all round givving 256 sample row & columns
	var offset = resolution / 2;
	var outFile;

	var n, s, e, w;

	n = halfMapExtent - y * tileWidth + offset;
	s = halfMapExtent - ( y + 1 ) * tileWidth - offset;

	w = - halfMapExtent + x * tileWidth - offset;
	e = - halfMapExtent + ( x + 1 ) * tileWidth + offset;

	if ( z > 8 ) {

		runCmd( 'g.region n=' + n + ' s=' + s + ' w=' +  w + ' e=' + e + ' nsres=' + resolution + ' ewres=' + resolution );

		outFile = 'dtm\\' + z + '\\DTM-' + x + '-' + y + '.bin';

		runCmd( 'r.out.bin -b bytes=2 input=DTM' + z + 'X@' + mapSet +  ' output=' + outFile );

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

var mapSet = 'Matienzo';

var tileSet = {
	title: 'Matienzo',
	dtmMaxZoom: 16,
	maxZoom: 18,
	minZoom: 12,
	divisions: 128,
	directory: '',
	subdirectory: 'Matienzo',
	dtmScale: 64,
	minX: 2005,
	maxX: 2008,
	minY: 1498,
	maxY: 1500
};


var x, y;

for ( x = tileSet.minX; x <= tileSet.maxX; x++ ) {

	for ( y = tileSet.minY; y <= tileSet.maxY; y++ ) {

		tileArea( x, y, tileSet.minZoom, tileSet.dtmMaxZoom );

	}

}

