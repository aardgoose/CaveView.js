
import { Colours } from './Colours';
import { Color, DataTexture, RGBFormat, UnsignedByteType, LinearFilter } from '../Three';

// define colors to share THREE.color objects

const caches = {
	'colors': [],
	'texture' : []
};

function createTexture ( scale ) {

	const l = scale.length;
	const data = new Uint8Array( l * 3 );

	var offset = 0;

	for ( var i = l; i; ) {

		const c = scale[ --i ];

		data[ offset++ ] = c[ 0 ];
		data[ offset++ ] = c[ 1 ];
		data[ offset++ ] = c[ 2 ];

	}

	const texture = new DataTexture( data, l, 1, RGBFormat, UnsignedByteType );

	texture.minFilter = LinearFilter;
	texture.magFilter = LinearFilter;

	texture.needsUpdate = true;

	return texture;

}

function createColors ( scale ) {

	const cache = [];

	for ( var i = 0, l = scale.length; i < l; i++ ) {

		let c = scale[ i ];

		cache[ i ] = new Color( c[ 0 ] / 255, c[ 1 ] / 255, c[ 2 ] / 255 );

	}

	return cache;

}

function getCacheEntry( cacheName, createFunc, name ) {

	const cache = caches[ cacheName ];

	var entry = cache[ name ];

	if ( entry === undefined ) {

		const scale = Colours[ name ];

		if ( scale === undefined ) console.error( 'unknown colour scale requested ' + name );

		entry = createFunc( scale );
		cache[ name ] = entry;

	}

	return entry;

}

function getTexture( name ) {

	return getCacheEntry( 'texture', createTexture, name );

}

function getColors( name ) {

	return getCacheEntry( 'colors', createColors, name );

}

export const ColourCache = {
	getTexture: getTexture,
	getColors: getColors,
	white: new Color( 0xffffff )
};
