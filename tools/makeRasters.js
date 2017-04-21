"use strict";

var halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition

var mapSet = 'UK';
var sourceRaster = 'gdem_uk';

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

var n,s,e,w, zoom;
var cmd;

var maxTileWidth = halfMapExtent / Math.pow( 2, tileSet.zoomMin - 1 );

for ( zoom = tileSet.zoomMin; zoom <= tileSet.dtmMaxZoom; zoom++ ) {

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