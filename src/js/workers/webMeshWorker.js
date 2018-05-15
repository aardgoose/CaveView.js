
import '../../../../three.js/src/polyfills';
import { TerrainMeshLoader } from '../loaders/TerrainMeshLoader';
import { TerrainMeshGeometry } from '../terrain/TerrainMeshGeometry';

var tileSpec;

onmessage = onMessage;

function onMessage ( event ) {

	tileSpec = event.data;

	new TerrainMeshLoader( tileSpec, mapLoaded, mapError ).load();

}

function mapLoaded ( meshData ) {

	// clip height map data

	const clip      = tileSpec.clip;
	const offsets   = tileSpec.offsets;
	const tileSet   = tileSpec.tileSet;
	const resolution = tileSpec.resolution;

	// offsets to translate tile to correct position relative to model centre

	offsets.x = resolution * tileSpec.x - 180 - offsets.x;
	offsets.y = resolution * tileSpec.y - 90 - offsets.y;

	var terrainTile;

	terrainTile = new TerrainMeshGeometry( resolution, resolution, meshData, tileSet.dtmScale, clip, offsets );

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