
import { Color }  from '../../../../three.js/src/math/Color';
import { Colours } from './Colours';
import { DataTexture }  from '../../../../three.js/src/textures/DataTexture';
import { RGBFormat, UnsignedByteType }  from '../../../../three.js/src/constants';

// define colors to share THREE.Color objects

var caches = {
	'colors': [],
	'texture' : []
};

function createTexture ( scale ) {

	var l = scale.length;
	var data = new Uint8Array( l * 3 );

	for ( var i = 0; i < l; ) {

		var c = scale[ l - ++i ];
		var offset = i * 3;

		data[ offset ]     = c[0];
		data[ offset + 1 ] = c[1];
		data[ offset + 2 ] = c[2];

	}

	var texture = new DataTexture( data, l, 1, RGBFormat, UnsignedByteType );

	texture.needsUpdate = true;

	return texture;

}

function createColors ( scale ) {

	var cache = [];
	var c;

	for ( var i = 0, l = scale.length; i < l; i++ ) {

		c = scale[ i ];

		cache[ i ] = new Color( c[ 0 ] / 255, c[ 1 ] / 255, c[ 2 ] / 255 );

	}

	return cache;

}

function getCacheEntry( cacheName, createFunc, name ) {

	var cache = caches[ cacheName ];
	var entry = cache[ name ];

	if ( entry === undefined ) {

		var scale = Colours[ name ];

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

export var ColourCache = {
	getTexture: getTexture,
	getColors: getColors,
	red:         new Color( 0xff0000 ),
	yellow:      new Color( 0xffff00 ),
	white:       new Color( 0xffffff ),
	grey:        new Color( 0x444444 )
};
