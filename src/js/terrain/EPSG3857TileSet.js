
import { Cfg } from '../core/lib';

import { FileLoader } from '../Three';

const halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition

var tileSets;

function EPSG3857TileSet( tileSetReady ) {

	new FileLoader().setResponseType( 'text' ).load( Cfg.value( 'terrainDirectory', '' ) + '/' + 'tileSets.json', _tileSetLoaded, function () {}, _tileSetMissing );

	return;

	function _tileSetLoaded ( text ) {

		tileSets = JSON.parse( text );
		tileSets.push( EPSG3857TileSet.defaultTileSet );

		tileSetReady();

	}

	function _tileSetMissing ( ) {

		tileSets = [ EPSG3857TileSet.defaultTileSet ];

		tileSetReady();

	}

}

EPSG3857TileSet.defaultTileSet = {
	isFlat: true,
	title: 'flat',
	dtmMaxZoom: 16,
	maxZoom: 18,
	minZoom: 10,
	divisions: 128,
	directory: null,
	subdirectory: null,
	dtmScale: 64,
	minX: 0,
	maxX: 1023,
	minY: 0,
	maxY: 1023,
	attributions: [],
	log: true
};

EPSG3857TileSet.prototype.workerScript = 'webTileWorker.js';

EPSG3857TileSet.prototype.getTileSets = function () {

	return tileSets;

};

EPSG3857TileSet.prototype.getCoverage = function ( limits, zoom ) {

	const coverage = { zoom: zoom };

	const N =  halfMapExtent;
	const W = -halfMapExtent;

	const tileCount = Math.pow( 2, zoom - 1 ) / halfMapExtent; // tile count per metre

	coverage.min_x = Math.floor( ( limits.min.x - W ) * tileCount );
	coverage.max_x = Math.floor( ( limits.max.x - W ) * tileCount );

	coverage.max_y = Math.floor( ( N - limits.min.y ) * tileCount );
	coverage.min_y = Math.floor( ( N - limits.max.y ) * tileCount );

	coverage.count = ( coverage.max_x - coverage.min_x + 1 ) * ( coverage.max_y - coverage.min_y + 1 );

	return coverage;

};

EPSG3857TileSet.prototype.getTileSpec = function ( x, y, z, limits ) {

	const tileSet = this.tileSet;
	const scale = ( z > tileSet.dtmMaxZoom ) ? Math.pow( 2, tileSet.dtmMaxZoom - z ) : 1;

	// don't zoom in with no overlay - no improvement of terrain rendering in this case

	if ( scale !== 1 && this.activeOverlay === null ) return null;

	if ( this.log ) console.log( 'load: [ ', z +'/' + x + '/' + y, ']' );

	const tileWidth = halfMapExtent / Math.pow( 2, z - 1 );

	const clip = { top: 0, bottom: 0, left: 0, right: 0 };

	const tileMinX = tileWidth * x - halfMapExtent;
	const tileMaxX = tileMinX + tileWidth;

	const tileMaxY = halfMapExtent - tileWidth * y;
	const tileMinY = tileMaxY - tileWidth;

	const divisions = ( tileSet.divisions ) * scale ;
	const resolution = tileWidth / divisions;

	// trim excess off sides of tile where overlapping with region

	if ( tileMaxY > limits.max.y ) clip.top = Math.floor( ( tileMaxY - limits.max.y ) / resolution );

	if ( tileMinY < limits.min.y ) clip.bottom = Math.floor( ( limits.min.y - tileMinY ) / resolution );

	if ( tileMinX < limits.min.x ) clip.left = Math.floor( ( limits.min.x - tileMinX ) / resolution );

	if ( tileMaxX > limits.max.x ) clip.right = Math.floor( ( tileMaxX - limits.max.x ) / resolution );

	const clipped = ( clip.top >= divisions || clip.bottom >= divisions || clip.left >= divisions || clip.right >= divisions );
	const clippedFraction = ( divisions - clip.top - clip.bottom ) * (divisions - clip.left - clip.right ) / ( divisions * divisions );

	return {
		tileSet: tileSet,
		divisions: divisions,
		resolution: resolution,
		x: x,
		y: y,
		z: z,
		clip: clip,
		offsets: null,
		flatZ: null,
		clipped: clipped,
		clippedFraction: clippedFraction
	};

};

export { EPSG3857TileSet };

// EOF