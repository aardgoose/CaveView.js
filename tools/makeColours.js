
var fs = require( 'fs' );

function read( f ) {

	return fs.readFileSync( f ).toString();

}

function include( f ) {

	eval.apply( global, [ read( f ) ] );

}

include( 'chroma.min.js' );


function mkJSON( colours ) {


	var l = colours.length;

	for ( var i = 0; i < l; i++ ) {

		var c = colours[ i ];

		c[ 0 ] = Math.round( c[ 0 ] );
		c[ 1 ] = Math.round( c[ 1 ] );
		c[ 2 ] = Math.round( c[ 2 ] );

	}

	return JSON.stringify( colours );

}

var gradientColours    = chroma.scale( [ '#EB636F', '#CA73AC', '#7B8EC6', '#109EB1', '#32A17E', '#759B4F', '#A98C41', '#C87D59' ] ).colors( 512, 'rgb' );
var depthColours       = chroma.scale( [ '#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026' ] ).colors( 512, 'rgb' );
var inclinationColours = chroma.scale( [ 'yellow', '008ae5' ] ).colors( 128, 'rgb' );
var terrainColours     = chroma.scale( [ 'LimeGreen', 'white' ] ).colors( 128, 'rgb' );


console.log( 'var gradientColours = ' + mkJSON( gradientColours ) + ';' );
console.log( 'var depthColours = ' + mkJSON( depthColours ) + ';' );
console.log( 'var inclinationColours = ' + mkJSON( inclinationColours ) + ';' );
console.log( 'var terrainColours = ' + mkJSON( terrainColours ) + ';' );

