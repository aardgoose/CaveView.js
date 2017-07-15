
import { HeightMapLoader } from '../loaders/HeightMapLoader';
import { TerrainTileGeometry } from '../terrain/TerrainTileGeometry';

var tileSpec;
var halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition

onmessage = onMessage;

function onMessage ( event ) {

	tileSpec = event.data;

	new HeightMapLoader( tileSpec, mapLoaded, mapError ).load();

}

function mapLoaded ( data ) {

	// clip height map data

	var clip       = tileSpec.clip;
	var offsets    = tileSpec.offsets;
	var tileSet    = tileSpec.tileSet;
	var divisions  = tileSpec.divisions;

	var terrainData = new Uint16Array( data );

	var xDivisions = divisions - clip.left - clip.right;
	var yDivisions = divisions - clip.top - clip.bottom;

	var resolution = tileSpec.resolution;

	var xTileWidth = resolution * xDivisions;
	var yTileWidth = resolution * yDivisions;

	clip.terrainHeight = tileSpec.divisions;
	clip.terrainWidth  = tileSpec.divisions;

	var terrainTile = new TerrainTileGeometry( xTileWidth, yTileWidth, xDivisions, yDivisions, terrainData, tileSet.dtmScale, clip, offsets.z );

	var X = resolution * ( tileSpec.x * divisions + clip.left ) - halfMapExtent - offsets.x;
	var Y = halfMapExtent - resolution * ( tileSpec.y * divisions + clip.top ) - offsets.y;

	terrainTile.translate( X, Y, 0 );

	terrainTile.computeBoundingBox();

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

	// support transferable objects where possible

	var indexBuffer = terrainTile.index.array.buffer;
	var attributes = {};
	var transferable = [];

	var srcAttributes = terrainTile.attributes;

	for ( var attributeName in srcAttributes ) {

		var attribute = srcAttributes[ attributeName ];
		var arrayBuffer = attribute.array.buffer;

		attributes[ attributeName ] = { array: arrayBuffer, itemSize: attribute.itemSize };

		transferable.push( arrayBuffer );

	}

	postMessage( { status: 'ok', index: indexBuffer, attributes: attributes, boundingBox: boundingBox }, transferable );

}

function mapError () {

	postMessage( { status: 'nomap' } );

}

// EOF