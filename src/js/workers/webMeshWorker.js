import { TerrainMeshLoader } from '../loaders/TerrainMeshLoader';
import { TerrainMeshGeometry } from '../terrain/TerrainMeshGeometry';
import { Box2 } from 'three/src/math/Box2.js';
import { Vector3 } from 'three/src/math/Vector3.js';
import proj4 from 'proj4';

var tileSpec;

onmessage = onMessage;

function onMessage ( event ) {

	tileSpec = event.data;

	new TerrainMeshLoader( tileSpec )
		.then( data => mapLoaded( data ) )
		.catch( () => postMessage( { status: 'nomap' } ) );

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

	const terrainTile = new TerrainMeshGeometry( x, y, resolution, meshData, offsets, transform, clip, tileSpec.clippedFraction );

	// we need to zoom if the tile doesnt contain enough vertices to give a reasonable surface

	if ( terrainTile.mustZoom ) {

		postMessage( { status: 'zoom' } );
		return;

	}

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

	for ( const attributeName in srcAttributes ) {

		const attribute = srcAttributes[ attributeName ];
		const arrayBuffer = attribute.array.buffer;

		attributes[ attributeName ] = { array: arrayBuffer, itemSize: attribute.itemSize };

		transferable.push( arrayBuffer );

	}

	postMessage(
		{
			status: 'ok',
			index: indexBuffer,
			attributes: attributes,
			boundingBox: boundingBox,
			canZoom: terrainTile.canZoom
		},
		transferable
	);

}