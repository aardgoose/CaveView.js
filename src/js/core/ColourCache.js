
import { Color }  from '../../../../three.js/src/math/Color';
import { Colours } from './Colours';
import { DataTexture }  from '../../../../three.js/src/textures/DataTexture';
import { RGBFormat, UnsignedByteType }  from '../../../../three.js/src/constants';

// define colors to share THREE.Color objects

var textureCache = {};
var cssCache = {};
var colorCache = {};

function createTexture ( scaleName ) {

	var colours = Colours[ scaleName ];

	if ( colours === undefined ) console.error( 'unknown colour range requested ' + scaleName );

	var l = colours.length;
	var data = new Uint8Array( l * 3 );

	for ( var i = 0; i < l; ) {

		var c = colours[ l - ++i ];
		var offset = i * 3;

		data[ offset ]     = c[0];
		data[ offset + 1 ] = c[1];
		data[ offset + 2 ] = c[2];

	}

	var texture = new DataTexture( data, l, 1, RGBFormat, UnsignedByteType );

	texture.needsUpdate = true;

	return texture;

}

function rgbToHex ( rgbColours ) {

	var colours = [];

	for ( var i = 0, l = rgbColours.length; i < l; i++ ) {

		var c = rgbColours[ i ];

		colours[ i ] = ( Math.round( c[ 0 ] ) << 16 ) + ( Math.round( c[ 1 ]) << 8 ) + Math.round( c[ 2 ] );

	}

	return colours;

}

function rgbToCSS ( rgbColours ) {

	var colours = [];

	for ( var i = 0, l = rgbColours.length; i < l; i++ ) {

		colours[ i ] = '#' +  rgbColours[ i ].toString( 16 );

	}

	return colours;

}

function createCSS ( scaleName ) {

	var colours = Colours[ scaleName ];

	if ( colours === undefined ) console.error( 'unknown colour range requested ' + scaleName );

	var css = [];

	for ( var i = 0, l = colours.length; i < l; i++ ) {

		css[ i ] = '#' +  colours[ i ].toString( 16 );

	}

	return css;

}

function createColors ( scaleName ) {

	var colours = Colours[ scaleName ];

	if ( colours === undefined ) console.error( 'unknown colour range requested ' + scaleName );

	var cache = [];
	var c;

	for ( var i = 0, l = colours.length; i < l; i++ ) {3

		var c = colours[ i ];
//		colours[ i ] = ( Math.round( c[ 0 ] ) << 16 ) + ( Math.round( c[ 1 ]) << 8 ) + Math.round( c[ 2 ] );

		cache[ i ] = new Color( c[ 0 ] / 255, c[ 1 ] / 255, c[ 2 ] / 255 );

	}

	return cache;

}

function getCSS( name ) {

	var css = cssCache[ name ];

	if ( css === undefined ) {

		css = createCSS( name );
		cssCache[ name ] = css;

	}

	return css;

}

function getTexture( name ) {

	var texture = textureCache[ name ];

	if ( texture === undefined ) {

		texture = createTexture( name );
		textureCache[ name ] = texture;

	}

	return texture;

}

function getColors( name ) {

	var colors = colorCache[ name ];

	if ( colors === undefined ) {

		colors = createColors( name );
		colorCache[ name ] = colors;

	}

	return colors;

}

export var ColourCache = {
	getTexture: getTexture,
	getCSS: getCSS,
	getColors: getColors,
	red:         new Color( 0xff0000 ),
	yellow:	     new Color( 0xffff00 ),
	white:       new Color( 0xffffff ),
	grey:        new Color( 0x444444 )
};
