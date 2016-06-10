"use strict";


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


var resolution;
var n,s,e,w;
var cmd;

e = region.E;
s = region.S;

for ( resolution = region.RESOLUTION_MAX; resolution >= region.RESOLUTION_MIN; resolution = resolution / 2 ) {

	n = region.N + resolution / 2;
	w = region.W - resolution / 2;

	cmd =  "g.region n=" +  n + " s=" + s + " w=" +  w + " e=" + e + " nsres=" + resolution + " ewres=" + resolution;
	console.log( cmd );

	if ( resolution > region.RESOLUTION_MIN ) {

		cmd = "r.resamp.interp --o input=SK2M@SK output=SK" + resolution + "M";
		console.log( cmd );

	}

	cmd = "r.mapcalc --o \"SK" + resolution + "X=round(SK" + resolution + "M@SK * 64)\"";
	console.log( cmd );

}

// EOF