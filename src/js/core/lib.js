"use strict";

var CV = CV || {};

CV.MATERIAL_LINE       = 1;
CV.MATERIAL_SURFACE    = 2;

CV.SHADING_HEIGHT      = 1;
CV.SHADING_LENGTH      = 2;
CV.SHADING_INCLINATION = 3;
CV.SHADING_CURSOR      = 4;
CV.SHADING_SINGLE      = 5;
CV.SHADING_SURVEY      = 6;
CV.SHADING_OVERLAY     = 7;
CV.SHADING_SHADED      = 8;
CV.SHADING_DEPTH       = 9;
CV.SHADING_PW          = 10;

CV.FEATURE_BOX           = 1;
CV.FEATURE_SELECTION_BOX = 2;
CV.FEATURE_ENTRANCES     = 3;
CV.FEATURE_TERRAIN       = 4;
CV.FACE_WALLS            = 5;
CV.FACE_SCRAPS           = 6;

CV.LEG_CAVE              = 7;
CV.LEG_SPLAY             = 8;
CV.LEG_SURFACE           = 9;

CV.upAxis = new THREE.Vector3( 0, 0, 1 );

CV.toOSref = function ( coordinate ) {

	var easting  = coordinate.x;
	var northing = coordinate.y;

	var firstLetter = "STNOH".charAt( Math.floor( easting / 500000 ) + Math.floor( northing / 500000 ) * 2 );

	var e2 = Math.floor( ( easting  % 500000 ) / 100000 );
	var n2 = Math.floor( ( northing % 500000 ) / 100000 );

	var secondLetter = "VWXYZQRSTULMNOPFGHJKABCDE".charAt( e2 + n2 * 5 );

	var e3 = Math.floor( easting  % 100000 ).toLocaleString( "en-GB", { minimumIntegerDigits: 6, useGrouping: false } );
	var n3 = Math.floor( northing % 100000 ).toLocaleString( "en-GB", { minimumIntegerDigits: 6, useGrouping: false } );

	return firstLetter + secondLetter + ' ' + e3 + ' ' + n3;

}

CV.padDigits = function ( number, digits ) {

	return Array( Math.max( digits - String( number ).length + 1, 0 ) ).join( 0 ) + number;

}

// EOF