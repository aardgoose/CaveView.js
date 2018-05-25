
import '../../../../three.js/src/polyfills';
import { TerrainMeshLoader } from '../loaders/TerrainMeshLoader';
import { TerrainMeshGeometry } from '../terrain/TerrainMeshGeometry';
import { Box2 } from '../../../../three.js/src/math/Box2';
import { Vector3 } from '../../../../three.js/src/math/Vector3';

importScripts( '../../lib/proj4.js' );

var tileSpec;

onmessage = onMessage;

function onMessage ( event ) {

	tileSpec = event.data;

	new TerrainMeshLoader( tileSpec, mapLoaded, mapError ).load();

}

function mapLoaded ( meshData ) {

	// clip height map data

	const offsets    = new Vector3().copy( tileSpec.offsets );
	const clip       = new Box2().copy( tileSpec.clip );

	const resolution = tileSpec.resolution;
	const transform  = proj4( 'EPSG:4326', tileSpec.displayCRS ); // eslint-disable-line no-undef

	// tile origin

	const x = resolution * tileSpec.x - 180;
	const y = resolution * tileSpec.y - 90;

	var terrainTile = new TerrainMeshGeometry( x, y, resolution, meshData, offsets, transform, clip );

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