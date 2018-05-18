'use strict';

const { execSync } = require( 'child_process' );

const halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition

function runCmd( cmd ) {

	console.log( cmd );
	execSync( cmd );

}

/*
var mapSet = 'Austria';
var sourceRaster = 'dhm_lamb_10m';

var tileSet = {
	title: 'Loser',
	dtmMaxZoom: 17,
	maxZoom: 18,
	minZoom: 13,
	divisions: 128,
	directory: '',
	subdirectory: 'Loser',
	dtmScale: 64,
	minX: 4409,
	maxX: 4410,
	minY: 2857,
	maxY: 2859
};
*/

var mapSet = 'Matienzo';
var sourceRaster = 'SOURCE';

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

var n, s, e, w, zoom;

var maxTileWidth = halfMapExtent / Math.pow( 2, tileSet.minZoom - 1 );

for ( zoom = tileSet.minZoom; zoom <= tileSet.dtmMaxZoom; zoom++ ) {

	var tileWidth = halfMapExtent / Math.pow( 2, zoom - 1 );
	var resolution = tileWidth / tileSet.divisions; // note: tile area extended by resolution/2 all round giving 129 sample row & columns
	var offset = resolution / 2;

	n =   halfMapExtent - tileSet.minY * maxTileWidth + offset; //
	s =   halfMapExtent - ( tileSet.maxY + 1) * maxTileWidth - offset;

	e = - halfMapExtent + ( tileSet.maxX + 1 ) * maxTileWidth + offset;
	w = - halfMapExtent + tileSet.minX * maxTileWidth - offset;

	runCmd( 'g.region n=' + n + ' s=' + s + ' w=' +  w + ' e=' + e + ' nsres=' + resolution + ' ewres=' + resolution );

	runCmd( 'r.resamp.interp --o input=' +  sourceRaster + '@' + mapSet + ' output=DTM' + zoom + 'M@' + mapSet );

	// scale by 64 to increase resolution as a 16b integer (smaller files and type usable by OpenGL)
	runCmd( 'r.mapcalc --o "DTM' + zoom + 'X=round(DTM' + zoom + 'M@' + mapSet + ' * 64)"' );

}

// EOF