'use strict';

var fs = require( 'fs' );
const { execSync } = require( 'child_process' );

const halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition

function runCmd( cmd ) {

	console.log( cmd );
	execSync( cmd );

}

function createRasters( tileSet ) {

	var mapSet = 'TEST';
	var sourceRaster = 'dummy';

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

		var tempFile = 'DTM' + zoom + 'M@' + mapSet;

		// define region

		runCmd( 'g.region n=' + n + ' s=' + s + ' w=' +  w + ' e=' + e + ' nsres=' + resolution + ' ewres=' + resolution );

		// produce downres of source

		runCmd( 'r.resamp.stats --verbose --o input=' + sourceRaster + '@' + mapSet + ' output=' + tempFile );

		// scale by 64 to increase resolution as a 16b integer (smaller files and type usable by OpenGL)
		runCmd( 'r.mapcalc --o "DTM' + zoom + 'X=round(' + tempFile + ' * 64)"' );

		runCmd( 'g.remove -f type=raster name=' + tempFile );

	}

}

const setName = 'Pokljuka';

var tileSetsText = fs.readFileSync( 'tileSets.json' );
var tileSets = JSON.parse( tileSetsText );

var tileSet = tileSets.find(  function ( e ) { return e.title === setName ;} );

if ( tileSet !== undefined ) {

	console.log( 'Creating rasters' );

	createRasters( tileSet );

}


// EOF