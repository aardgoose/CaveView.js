"use strict";

var halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition

var mapSet = 'PeakDistrict';
var sourceRaster = 'SK2M';

var minX = 1013;
var maxX = 1014;

var minY = 663;
var maxY = 665;

var minZoom = 11;
var maxZoom = 14;

var n,s,e,w, zoom;
var cmd;

var maxTileWidth = halfMapExtent / Math.pow( 2, minZoom - 1 );

for ( zoom = minZoom; zoom <= maxZoom; zoom++ ) {

	var tileWidth = halfMapExtent / Math.pow( 2, zoom - 1 );
	var resolution = tileWidth / 128; // note: tile area extended by resolution/2 all round giving 129 sample row & columns
	var offset = resolution / 2;

	n =   halfMapExtent - minY * maxTileWidth + offset; //
	s =   halfMapExtent - ( maxY + 1) * maxTileWidth - offset;

	e = - halfMapExtent + ( maxX + 1 ) * maxTileWidth + offset;
	w = - halfMapExtent + minX * maxTileWidth - offset;

	cmd =  'g.region n=' + n + ' s=' + s + ' w=' +  w + ' e=' + e + ' nsres=' + resolution + ' ewres=' + resolution;
	console.log( cmd );

	cmd = 'r.resamp.interp --o input=' +  sourceRaster + '@' + mapSet + ' output=DTM' + zoom + 'M@' + mapSet;
	console.log( cmd );

	// scale by 64 to increase resolution as a 16b integer (smaller files and type usable by OpenGL)
	cmd = 'r.mapcalc --o "DTM' + zoom + 'X=round(DTM' + zoom + 'M@' + mapSet + ' * 64)"';
	console.log( cmd );

}

// EOF