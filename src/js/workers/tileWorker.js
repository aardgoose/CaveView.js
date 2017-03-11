
import { HeightMapLoader } from '../loaders/HeightMapLoader';
import { TerrainTileGeometry }  from '../terrain/TerrainTileGeometry';

var tileSpec;

onmessage = onMessage;

function onMessage ( event ) {

	tileSpec = event.data;

	new HeightMapLoader( tileSpec.tileSet, tileSpec.resolution, tileSpec.tileX, tileSpec.tileY, mapLoaded, mapError ).load();

}

function mapLoaded ( data, x, y ) {

	// clip height map data

	var clip       = tileSpec.clip;
	var divisions  = tileSpec.tileSet.TILESIZE - 1;
	var resolution = tileSpec.resolution;
	var tileSet    = tileSpec.tileSet;

	// clip excess rows from top of height map

	var offset = clip.top * tileSet.TILESIZE * Uint16Array.BYTES_PER_ELEMENT;

	var terrainDataTyped = new Uint16Array( data, offset );
	var terrainData;

	var xDivisions = divisions - clip.left - clip.right;
	var yDivisions = divisions - clip.top - clip.bottom;

	var i, j, l, l1, l2;

	// clip excess left and right columns from height map

	if ( clip.left || clip.right ) {

		var columns = tileSet.TILESIZE;
		var rowStart;

		terrainData = [];

		for ( i = 0, l1 = yDivisions + 1; i < l1; i++ ) {

			// per row of data
			rowStart = i * columns + clip.left;

			for ( j = 0, l2 = xDivisions + 1; j < l2; j++ ) {

				terrainData.push( terrainDataTyped[ rowStart + j ] );

			}

		}

	} else {

		terrainData = terrainDataTyped;

	}

	var xTileWidth = xDivisions * resolution;
	var yTileWidth = yDivisions * resolution;

	var xTileOffset = xTileWidth / 2 ;
	var yTileOffset = yTileWidth / 2 ;

	var N = tileSet.N;
	var W = tileSet.W;

	var X = W + xTileOffset + resolution * ( tileSpec.tileX * divisions + clip.left );
	var Y = N - yTileOffset - resolution * ( tileSpec.tileY * divisions + clip.top );

	var scale = tileSet.SCALE;

	var terrainTile = new TerrainTileGeometry( xTileWidth, yTileWidth, xDivisions, yDivisions, terrainData, scale );

	terrainTile.translate( X, Y, 0 );

	// avoid calculating bounding box in main thread.
	// however it isn't preserved in json serialisation.

	var bb = terrainTile.boundingBox;
	
	var boundingBox = {

		min: {
			x: bb.min.x,
			y: bb.min.y,
			z: bb.min.z
		},

		max: {

			x: bb.max.x,
			y: bb.max.y,
			z: bb.max.z
		}

	};

	// FIXME avoid JSON convertion

	var json = terrainTile.toJSON();

	// support transferable objects where possible
	// convertion from Array to ArrayBuffer improves main script side performance

	var transferable = [];

	for ( var attributeName in json.data.attributes ) {

		var attribute = json.data.attributes[ attributeName ];
		var fBuffer = new Float32Array( attribute.array );

		attribute.arrayBuffer = fBuffer.buffer;
		attribute.array = null;

		transferable.push( attribute.arrayBuffer );

	}

	postMessage( { status: 'ok', json: json, x: x, y: y, boundingBox: boundingBox }, transferable );

}

function mapError () {

	postMessage( { status: 'nomap' } );

}

// EOF