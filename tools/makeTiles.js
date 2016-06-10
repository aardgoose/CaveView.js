"use strict";

function padDigits ( number, digits ) {

	return Array( Math.max( digits - String( number ).length + 1, 0 ) ).join( 0 ) + number;

}

var region = {
	"N": 390000,
	"S": 340000,
	"E": 430000,
	"W": 400000,

	"TILESIZE": 256,
	"BASEDIR": "SK",
	"PREFIX": "SK",
	"RESOLUTION_MIN": 2,
	"RESOLUTION_MAX": 64,
	"SCALE": 64
}

var i, j, outFile, cmd;
var n, s, e, w;

var resolution = 2;
var tileSize   = 256;
var left       = region.W - resolution / 2;
var top        = region.N + resolution / 2;

var tileWidth  = resolution * tileSize;
var tileOffset = tileWidth - resolution;

var prefix = region.PREFIX + resolution + "M" + tileSize + "-";

for ( i = 0; left < region.E; i++ ) {

	top = region.N;

	for ( j = 0; top > region.S; j++ ) {

		w = left;
		n = top;
		e = w + tileWidth;
		s = n - tileWidth;

		cmd =  "g.region n=" +  n + " s=" + s + " w=" +  w + " e=" + e + " nsres=" + resolution + " ewres=" + resolution;

		console.log( cmd );

		outFile = prefix + padDigits( j, 3 ) + "-" + padDigits( i, 3 ) + ".bin";
		cmd = "r.out.bin -b bytes=2 input=SK" + resolution + "X@SK output=" + outFile;

		console.log( cmd );

		top = top - tileOffset;

	}

	left = left + tileOffset;

}

console.log("del *.hdr");
console.log("del *.wld");

