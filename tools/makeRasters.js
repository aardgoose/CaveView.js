"use strict";

var halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition

var mapSet = 'Mulu';
var sourceRaster = 'mulu3';

var tileSet = {
	title: 'Mulu',
	dtmMaxZoom: 13,
	maxZoom: 18,
	minZoom: 10,
	divisions: 128,
	directory: '',
	subdirectory: 'mulu',
	dtmScale: 64,
	minX: 838,
	maxX: 839,
	minY: 499,
	maxY: 500
};

var n,s,e,w, zoom;
var cmd;

var maxTileWidth = halfMapExtent / Math.pow( 2, tileSet.minZoom - 1 );

for ( zoom = tileSet.minZoom; zoom <= tileSet.dtmMaxZoom; zoom++ ) {

	var tileWidth = halfMapExtent / Math.pow( 2, zoom - 1 );
	var resolution = tileWidth / tileSet.divisions; // note: tile area extended by resolution/2 all round giving 129 sample row & columns
	var offset = resolution / 2;

	n =   halfMapExtent - tileSet.minY * maxTileWidth + offset; //
	s =   halfMapExtent - ( tileSet.maxY + 1) * maxTileWidth - offset;

	e = - halfMapExtent + ( tileSet.maxX + 1 ) * maxTileWidth + offset;
	w = - halfMapExtent + tileSet.minX * maxTileWidth - offset;

	cmd =  'g.region n=' + n + ' s=' + s + ' w=' +  w + ' e=' + e + ' nsres=' + resolution + ' ewres=' + resolution;
	console.log( cmd );

	cmd = 'r.resamp.interp --o input=' +  sourceRaster + '@' + mapSet + ' output=DTM' + zoom + 'M@' + mapSet;
	console.log( cmd );

	// scale by 64 to increase resolution as a 16b integer (smaller files and type usable by OpenGL)
	cmd = 'r.mapcalc --o "DTM' + zoom + 'X=round(DTM' + zoom + 'M@' + mapSet + ' * 64)"';
	console.log( cmd );

}

// EOF