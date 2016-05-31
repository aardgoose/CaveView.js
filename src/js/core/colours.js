"use strict";

var CV = CV || {};

CV.Colours = ( function () {

	var gradientColours    = chroma.scale( [ "#EB636F", "#CA73AC", "#7B8EC6", "#109EB1", "#32A17E", "#759B4F", "#A98C41", "#C87D59" ] ).colors( 512, "rgb" );
	var depthColours       = chroma.scale( [ "#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026" ] ).colors( 512, "rgb" );
	var inclinationColours = chroma.scale( [ "yellow", "008ae5" ] ).colors( 128, "rgb" );
	var terrainColours     = chroma.scale( [ "LimeGreen", "white" ] ).colors( 128, "rgb" );
	var surveyColours      = [ 0xa6cee3, 0x1f78b4, 0xb2df8a, 0x33a02c, 0xfb9a99, 0xe31a1c, 0xfdbf6f, 0xff7f00, 0xcab2d6, 0x6a3d9a, 0xffff99 ];

	var gradientTexture    = scaleToTexture( gradientColours );
	var depthTexture       = scaleToTexture( depthColours );

	var gradientColoursRGB    = rgbToHex( gradientColours );
	var terrainColoursRGB     = rgbToHex( terrainColours );
	var inclinationColoursRGB = rgbToHex( inclinationColours );
	var surveyColoursRGB      = surveyColours;

	var surveyColoursCSS      = rgbToCSS( surveyColours );

function scaleToTexture ( colours ) {

	var l = colours.length;
	var data = new Uint8Array( l * 3 );

	for ( var i = 0; i < l; i++ ) {

		var c      = colours[ i ];
		var offset = i * 3;

		data[ offset ]     = Math.round( c[0] );
		data[ offset + 1 ] = Math.round( c[1] );
		data[ offset + 2 ] = Math.round( c[2] );

	}

	var texture = new THREE.DataTexture( data, l, 1, THREE.RGBFormat, THREE.UnsignedByteType );

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

		colours[ i ] = "#" +  rgbColours[ i ].toString( 16 );

	}

	return colours;

}

return {
	surveyColoursCSS:    surveyColoursCSS,
	inclinationColours:  inclinationColoursRGB,
	terrainColours:      terrainColoursRGB,
	gradientColours:     gradientColoursRGB,
	surveyColours:       surveyColoursRGB,
	gradientTexture:     gradientTexture,
	depthTexture:        depthTexture
};

} () ); // end of Colours module

CV.ColourCache = ( function () {

	var white = new THREE.Color( 0xffffff );
	var grey  = new THREE.Color( 0x444444 );
	var red   = new THREE.Color( 0xff0000 );

	// define colors to share THREE.Color objects

	var inclinationColours = createCache( CV.Colours.inclinationColours );
	var terrainColours     = createCache( CV.Colours.terrainColours );
	var gradientColours    = createCache( CV.Colours.gradientColours );
	var surveyColours      = createCache( CV.Colours.surveyColours );

	function createCache ( colours ) {

		var cache = [];

		for ( var i = 0, l = colours.length; i < l; i++ ) {

			cache[i] = new THREE.Color( colours[i] );

		}

		return cache;

	}

	return {
		inclination: inclinationColours,
		terrain:     terrainColours,
		gradient:    gradientColours,
		survey:      surveyColours,
		red:         red,
		white:       white,
		grey:        grey
	};
} ());