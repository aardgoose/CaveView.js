
import 'three/src/polyfills';
import { HeightMapboxLoader } from '../loaders/HeightMapboxLoader';
import { TerrainTileGeometry } from '../terrain/TerrainTileGeometry';
import { FlatTileGeometry } from '../terrain/FlatTileGeometry';

const halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition
const offscreen = new OffscreenCanvas(256, 256);
const ctx = offscreen.getContext( '2d' );

var tileSpec;

onmessage = onMessage;

function onMessage ( event ) {

	tileSpec = event.data;

	const tileSet = tileSpec.tileSet;

	if ( tileSet.isFlat ) {

		mapLoaded( null );

	} else {

		new HeightMapboxLoader( tileSpec, mapLoaded, mapError ).load();

	}

}

function mapLoaded ( data ) {

	if ( data === null ) {

		handleMap( new Uint8Array( 256 * 256 ) );
		return;

	}

	createImageBitmap( new Blob( [ data ] ) ).then( function ( ib ) {

		ctx.drawImage( ib, 0, 0, 256, 256 );

		const imageData = ctx.getImageData( 0, 0, 256, 256 );

		const d = imageData.data;
		const terrainData = Array( 256 * 256 );

		for (var i = 0; i < 256 * 256 * 4; i += 4 ) {

			const R = d[ i ];
			const G = d[ i + 1 ];
			const B = d[ i + 2 ];

			const height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1);

			terrainData[ i / 4 ] = height;

		}

		handleMap( terrainData );

	} );

}

function handleMap ( terrainData ) {

	switch ( tileSpec.request ) {

	case 'tile':

		loadTile( terrainData );
		break;

	case 'height':

		getHeight( terrainData );
		break;

	default:

		console.log( 'webTileWorker: unknown request type' );
		mapError();

	}

}

function getHeight ( terrainData ) {

	const offsets = tileSpec.dataOffsets;
	const points = tileSpec.points;

	const pointCount = offsets.length;

	var i;

	for ( i = 0; i < pointCount; i++ ) {

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

	var terrainTile;

	if ( tileSet.isFlat || terrainData === null ) {

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