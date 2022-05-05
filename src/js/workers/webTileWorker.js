import { HeightMapLoader } from '../loaders/HeightMapLoader';
import { TerrainTileGeometry } from '../terrain/TerrainTileGeometry';
import { FlatTileGeometry } from '../terrain/FlatTileGeometry';

const halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition
let tileSpec;

onmessage = onMessage;

function onMessage ( event ) {

	tileSpec = event.data;

	const tileSet = tileSpec.tileSet;

	if ( tileSet.isFlat ) {

		mapLoaded( null );

	} else {

		new HeightMapLoader( tileSpec )
			.then( data => mapLoaded( data ) )
			.catch( () => { postMessage( { status: 'nomap' } ); } );

	}

}

function dzzDecode( data, size ) {

	const buffer = new Uint8Array( data );
	const target = new Uint32Array( size );

	// handle empty files.
	if ( buffer.length === 4 ) return target;

	let last = 0, outPos = 0;

	for ( let i = 0; i < buffer.length; i++ ) {

		let z = 0, shift = 0;
		let b = buffer[ i ];

		while ( b & 0x80 ) {

			z |= ( b & 0x7F ) << shift;
			shift += 7;
			b = buffer[ ++i ];

		}

		z |= b << shift;

		const v = ( z & 1 ) ? ( z >> 1 ) ^ -1 : ( z >> 1 );

		last += v;
		target[ outPos++ ] = last;

	}

	return target;

}

function mapLoaded ( data ) {

	const tileSet = tileSpec.tileSet;

	let terrainData;

	if ( tileSet.encoding === 'dzz' ) {

		const dtmDivisions = tileSet.divisions + 1;
		terrainData = dzzDecode( data, dtmDivisions * dtmDivisions );

	} else {

		terrainData = new Uint16Array( data );

	}

	switch ( tileSpec.request ) {

	case 'tile':

		loadTile( terrainData );
		break;

	case 'height':

		getHeight( terrainData );
		break;

	default:

		console.log( 'webTileWorker: unknown request type' );
		postMessage( { status: 'nomap' } );

	}

}

function getHeight ( terrainData ) {

	const offsets = tileSpec.dataOffsets;
	const points = tileSpec.points;

	const pointCount = offsets.length;

	for ( let i = 0; i < pointCount; i++ ) {

		points[ i ].z = terrainData[ offsets[ i ] ] / tileSpec.tileSet.dtmScale;

	}

	postMessage( { status: 'ok', points: points} );

}

function loadTile ( terrainData ) {

	// clip height map data

	const clip      = tileSpec.clip;
	const offsets   = tileSpec.offsets;
	const tileSet   = tileSpec.tileSet;
	const divisions = tileSpec.divisions;

	const xDivisions = divisions - clip.left - clip.right;
	const yDivisions = divisions - clip.top - clip.bottom;

	const resolution = tileSpec.resolution;

	const xTileWidth = resolution * xDivisions;
	const yTileWidth = resolution * yDivisions;

	clip.terrainHeight = divisions;
	clip.terrainWidth  = divisions;

	// offsets to translate tile to correct position relative to model centre

	offsets.x = resolution * ( tileSpec.x * divisions + clip.left ) - halfMapExtent - offsets.x;
	offsets.y = halfMapExtent - resolution * ( tileSpec.y * divisions + clip.top ) - offsets.y;

	let terrainTile;

	if ( tileSet.isFlat ) {

		terrainTile = new FlatTileGeometry( xTileWidth, yTileWidth, clip, offsets, tileSpec.flatZ );

	} else {

		terrainTile = new TerrainTileGeometry( xTileWidth, yTileWidth, xDivisions, yDivisions, terrainData, tileSet.dtmScale, clip, offsets );

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
			canZoom: true
		},
		transferable
	);

}