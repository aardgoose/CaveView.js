
import '../../../../three.js/src/polyfills';
import { HeightMapLoader } from '../loaders/HeightMapLoader';
import { TerrainTileGeometry } from '../terrain/TerrainTileGeometry';

const halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition
var tileSpec;

onmessage = onMessage;

function onMessage ( event ) {

	tileSpec = event.data;

	new HeightMapLoader( tileSpec, mapLoaded, mapError ).load();

}

function mapLoaded ( data ) {

	// clip height map data

	const clip      = tileSpec.clip;
	const offsets   = tileSpec.offsets;
	const tileSet   = tileSpec.tileSet;
	const divisions = tileSpec.divisions;

	const terrainData = new Uint16Array( data );

	const xDivisions = divisions - clip.left - clip.right;
	const yDivisions = divisions - clip.top - clip.bottom;

	const resolution = tileSpec.resolution;

	const xTileWidth = resolution * xDivisions;
	const yTileWidth = resolution * yDivisions;

	clip.terrainHeight = tileSpec.divisions;
	clip.terrainWidth  = tileSpec.divisions;

	// offsets to translate tile to correct position relative to model centre

	offsets.x = resolution * ( tileSpec.x * divisions + clip.left ) - halfMapExtent - offsets.x;
	offsets.y = halfMapExtent - resolution * ( tileSpec.y * divisions + clip.top ) - offsets.y;

	const terrainTile = new TerrainTileGeometry( xTileWidth, yTileWidth, xDivisions, yDivisions, terrainData, tileSet.dtmScale, clip, offsets );

	// avoid calculating bounding box in main thread.
	// however it isn't preserved in json serialisation.

	const bb = terrainTile.boundingBox;

	const boundingBox = {

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

	const indexBuffer = terrainTile.index.array.buffer;
	const attributes = {};
	const transferable = [];

	const srcAttributes = terrainTile.attributes;

	for ( var attributeName in srcAttributes ) {

		const attribute = srcAttributes[ attributeName ];
		const arrayBuffer = attribute.array.buffer;

		attributes[ attributeName ] = { array: arrayBuffer, itemSize: attribute.itemSize };

		transferable.push( arrayBuffer );

	}

	postMessage( { status: 'ok', index: indexBuffer, attributes: attributes, boundingBox: boundingBox }, transferable );

}

function mapError () {

	postMessage( { status: 'nomap' } );

}

// EOF