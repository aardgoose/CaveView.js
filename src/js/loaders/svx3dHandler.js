// Survex 3d file handler

import { NORMAL, SPLAY, SURFACE, STATION_NORMAL, STATION_ENTRANCE } from '../core/constants.js';
import { Tree } from '../core/Tree.js';

function Svx3dHandler ( fileName, dataStream ) {

	this.fileName   = fileName;
	this.groups     = [];
	this.entrances  = [];
	this.surface    = [];
	this.xGroups    = [];
	this.surveyTree = new Tree();
	this.isRegion   = false;

	var surveyTree  = this.surveyTree;

	var source    = dataStream;  // file data as arrrayBuffer
	var pos       = 0;	         // file position

	// read file header
	var stdHeader = readLF(); // Survex 3D Image File
	var version   = readLF(); // 3d version
	var title     = readLF(); // Title
	var date      = readLF(); // Date

	console.log( "title: ", title);

	this.handleVx( source, pos, Number( version.charAt( 1 ) ) );

	return;

	function readLF () { // read until Line feed

		var bytes = new Uint8Array( source, 0 );

		var lfString = [];
		var b;

		do {

			b = bytes[ pos++ ];
			lfString.push( b );

		} while ( b != 0x0a )

		var s = String.fromCharCode.apply( null, lfString ).trim();

		console.log( s  );

		return s;
	}
}

Svx3dHandler.prototype.constructor = Svx3dHandler;

Svx3dHandler.prototype.handleVx = function ( source, pos, version ) {

	var groups     = this.groups;
	var entrances  = this.entrances;
	var xGroups    = this.xGroups;
	var surveyTree = this.surveyTree;

	var cmd         = [];
	var legs        = [];
	var label       = "";
	var readLabel;
	var fileFlags   = 0;
	var style       = 0;
	var stations    = new Map();
	var lineEnds    = new Set(); // implied line ends to fixnup xsects
	var xSects      = [];
	var sectionId   = 0;

	var data       = new Uint8Array( source, 0 );
	var dataLength = data.length;
	var lastPosition = { x: 0, y:0, z: 0 }; // value to allow approach vector for xsect coord frame
	var i;

	// init cmd handler table withh  error handler for unsupported records or invalid records

	for ( i = 0; i < 256; i++ ) {

		cmd[ i ] = function ( e ) { console.log ('unhandled command: ', e.toString( 16 ) ); return false; };	

	}

	if ( version === 8 ) {
		// v8 dispatch table start

		cmd[ 0x00 ] = cmd_STYLE;
		cmd[ 0x01 ] = cmd_STYLE;
		cmd[ 0x02 ] = cmd_STYLE;
		cmd[ 0x03 ] = cmd_STYLE;
		cmd[ 0x04 ] = cmd_STYLE;

		cmd[ 0x0f ] = cmd_MOVE;
		cmd[ 0x10 ] = cmd_DATE_NODATE;
		cmd[ 0x11 ] = cmd_DATEV8_1;
		cmd[ 0x12 ] = cmd_DATEV8_2;
		cmd[ 0x13 ] = cmd_DATEV8_3;

		cmd[ 0x1F ] = cmd_ERROR;

		cmd[ 0x30 ] = cmd_XSECT16;
		cmd[ 0x31 ] = cmd_XSECT16;

		cmd[ 0x32 ] = cmd_XSECT32;
		cmd[ 0x33 ] = cmd_XSECT32;

		for ( i = 0x40; i < 0x80; i++ ) {

			cmd[ i ] = cmd_LINE;

		}

		for ( i = 0x80; i < 0x100; i++ ) {

			cmd[ i ] = cmd_LABEL;

		}

		// dispatch table end

		readLabel = readLabelV8;	

		// v8 file wide flags after header
		fileFlags = data[ pos++ ];

	} else {

		// dispatch table for v7 format 

		for ( i = 0x01; i < 0x0f; i++ ) {

			cmd[ i ] = cmd_TRIM_PLUS;

		}

		cmd[ 0x0f ] = cmd_MOVE;

		for ( i = 0x10; i < 0x20; i++ ) {

			cmd[ i ] = cmd_TRIM;

		}

		cmd[ 0x00 ] = cmd_STOP;
		cmd[ 0x20 ] = cmd_DATE_V7;
		cmd[ 0x21 ] = cmd_DATE2_V7;
		cmd[ 0x23 ] = cmd_DATE3_V7;
		cmd[ 0x24 ] = cmd_DATE_NODATE;
		cmd[ 0x22 ] = cmd_ERROR;

		cmd[ 0x30 ] = cmd_XSECT16;
		cmd[ 0x31 ] = cmd_XSECT16;

		cmd[ 0x32 ] = cmd_XSECT32;
		cmd[ 0x33 ] = cmd_XSECT32;

		for ( i = 0x40; i < 0x80; i++ ) {

			cmd[ i ] = cmd_LABEL;

		}

		for ( i = 0x80; i < 0xc0; i++ ) {

			cmd[ i ] = cmd_LINE;

		}
		// dispatch table end

		readLabel = readLabelV7;

	}

	if ( version === 6 ) {
	
		cmd[ 0x20 ] = cmd_DATE_V4;
		cmd[ 0x21 ] = cmd_DATE2_V4;

	}

	// common record iterator
	// loop though data, handling record types as required.

	while ( pos < dataLength ) {

		if ( !cmd[ data[ pos ] ]( data[ pos++ ] ) ) break;

	}

	if ( xSects.length > 1 ) {

		xGroups.push( xSects );

	}

	groups.push( legs );

	return;

	function readLabelV7 () {
		// find length of label and read label = v3 - v7 .3d format

		var len = 0;
		var l;

		switch ( data[ pos ] ) {

			case 0xfe:

				l = new DataView( source, pos );

				len = l.getUint16( 0, true ) + data[ pos ];
				pos += 2;

				break;

			case 0xff:

				l = new DataView( source, pos );

				len = l.getUint32( 0, true );
				pos +=4;

				break;

			default:

				len = data[ pos++ ];
		}

		if ( len === 0 ) return false; // no label

		var db = [];

		for ( var i = 0; i < len; i++ ) {
	
			db.push( data[ pos++ ] );

		}

		label = label + String.fromCharCode.apply( null, db  );

		return true;

	}

	function readLabelV8 ( flags ) {

		if ( flags & 0x20 )  return false; // no label change

		var b = data[ pos++ ];
		var add = 0;
		var del = 0;

		if ( b !== 0 ) {

			// handle 4b= bit del/add codes
			del = b >> 4;   // left most 4 bits
			add = b & 0x0f; // right most 4 bits

		} else {

			// handle 8 bit and 32 bit del/add codes
			b = data[ pos++ ];

			if ( b !== 0xff ) {

				del = b;

			} else {

				var l = new DataView( source, pos );

				del = l.getUint32( 0, true );
				pos +=4;

			}

			b = data[ pos++ ];

			if ( b !== 0xff ) {

				add = b;

			} else {

				var l = new DataView( source, pos );

				add = l.getUint32( 0, true );
				pos +=4;

			}
		}

		if ( add === 0 && del === 0 ) return;

		if ( del ) label = label.slice( 0, -del );

		if ( add ) {

			var db = [];

			for ( var i = 0; i < add; i++ ) {

				db.push( data[pos++] );

			}

			label = label + String.fromCharCode.apply( null, db );

		}

		return true;

	}

	function cmd_STOP ( c ) {

		if ( label ) label = "";

		return true;

	}

	function cmd_TRIM_PLUS ( c ) { // v7 and previous

		label = label.slice( 0, -16 );

		if ( label.charAt( label.length - 1 ) == ".") label = label.slice( 0, -1 ); // strip trailing "."

		var parts = label.split( "." );

		parts.splice( -( c ) );
		label = parts.join( "." );

		if ( label ) label = label + ".";

		return true;

	}

	function cmd_TRIM ( c ) {  // v7 and previous

		var trim = c - 15;

		label = label.slice( 0, -trim );

		return true;

	}
 
	function cmd_DATE_V4 ( c ) {

		pos += 4;

		return true;

	}

	function cmd_DATE_V7 ( c ) {

		pos += 2;

		return true;

	}

	function cmd_DATE3_V7 ( c ) {

		pos += 4;

		return true;

	}

	function cmd_DATE2_V4 ( c ) {

		pos += 8;

		return true;

	}

	function cmd_DATE2_V7 ( c ) {

		pos += 3;

		return true;

	}

	function cmd_STYLE ( c ) {

		style = c;

		return true;

	}

	function cmd_DATEV8_1 ( c ) {

		pos += 2;

		return true;

	}

	function cmd_DATEV8_2 ( c ) {

		console.log( "v8d2" );
		pos += 3;

		return true;

	}

	function cmd_DATEV8_3 ( c ) {

		pos += 4;

		return true;
	}

	function cmd_DATE_NODATE ( c ) {

		return true;

	}

	function cmd_LINE ( c ) {

		var flags = c & 0x3f;

		if ( readLabel( flags ) ) {

			// we have a new section name, add it to the survey tree
			sectionId = surveyTree.addPath( label.split( "." ) );

		}

		var coords = readCoordinates( flags );

		if ( flags & 0x01 ) {

			legs.push( { coords: coords, type: SURFACE, survey: sectionId } );

		} else if ( flags & 0x04 ) {

			legs.push( { coords: coords, type: SPLAY, survey: sectionId } );

		} else {

			legs.push( { coords: coords, type: NORMAL, survey: sectionId } );

		}

		lastPosition = coords;

		return true;

	}

	function cmd_MOVE ( c ) {

		// new set of line segments
		if ( legs.length > 1 ) groups.push( legs );

		legs = [];

		// heuristic to detect line ends. lastPosition was presumably set in a line sequence therefore is at the end 
		// of a line, Add the current label, presumably specified in the last LINE, to a Set of lineEnds.

		lineEnds.add( [ lastPosition.x, lastPosition.y, lastPosition.z ].toString() );

		var coords = readCoordinates( 0x00 );

		legs.push( { coords: coords } );

		lastPosition = coords;

		return true;

	}

	function cmd_ERROR ( c ) {
		//var l = new DataView(source, pos);

		//console.log("legs   : ", l.getInt32(0, true));
		//console.log("length : ", l.getInt32(4, true));
		//console.log("E      : ", l.getInt32(8, true));
		//console.log("H      : ", l.getInt32(12, true));
		//console.log("V      : ", l.getInt32(16, true));
		pos += 20;

		return true;

	}

	function cmd_LABEL ( c ) {

		var flags = c & 0x7f;

		readLabel( 0 );

		var coords = readCoordinates( flags );
		var path = label.split( "." );

		stations.set( label, coords );

		if ( flags & 0x02 ) surveyTree.addPath ( path, { p: coords, type: ( flags & 0x04 ) ? STATION_ENTRANCE : STATION_NORMAL } );

		if ( flags & 0x04 ) {

			// get survey path by removing last component of station name
			path.pop();

			var surveyId = surveyTree.getIdByPath( path );

			entrances.push( { position: coords, label: label, survey: surveyId } );

		}

		return true;

	}

	function cmd_XSECT16 ( c ) {

		var flags = c & 0x01;

		readLabel( flags );

		var l = new DataView( source, pos );

		var lrud = {
			l: l.getInt16( 0, true ) / 100,
			r: l.getInt16( 2, true ) / 100,
			u: l.getInt16( 4, true ) / 100,
			d: l.getInt16( 6, true ) / 100
		};

		pos += 8;

		return commonXSECT( flags, lrud );


	}

	function cmd_XSECT32 ( c ) {

		var flags = c & 0x01;

		readLabel( flags );

		var l = new DataView( source, pos );

		var lrud = {
			l: l.getInt32( 0, true ) / 100,
			r: l.getInt32( 0, true ) / 100,
			u: l.getInt32( 0, true ) / 100,
			d: l.getInt32( 0, true ) / 100
		};

		pos += 16;

		return commonXSECT( flags, lrud );

	}

	function commonXSECT( flags, lrud ) {

		var position = stations.get( label );

		if ( !position ) return;

		var station = label.split( "." );

		// get survey path by removing last component of station name
		station.pop();

		var surveyId = surveyTree.getIdByPath( station );

		// FIXME to get a approach vector for the first XSECT in a run so we can add it to the display
		xSects.push( { start: lastPosition, end: position, lrud: lrud, survey: surveyId } );

		lastPosition = position;

		// some XSECTS are not flagged as last in passage
		// heuristic - the last line position before a move is an implied line end.
		// cmd_MOVE saves these in the set lineEnds.
		// this fixes up surveys that display incorrectly withg 'fly-back' artefacts in Aven and Loch.

		if ( flags || lineEnds.has( [ position.x, position.y, position.z ].toString() ) ) {

			if ( xSects.length > 1 ) xGroups.push( xSects );

			lastPosition = { x: 0, y: 0, z: 0 };
			xSects = [];

		}

		return true;

	}

	function readCoordinates ( flags ) {

		var l = new DataView( source, pos );
		var coords = {};

		coords.x = l.getInt32( 0, true ) / 100;
		coords.y = l.getInt32( 4, true ) / 100;
		coords.z = l.getInt32( 8, true ) / 100;
		pos += 12;

		return coords;

	}

}

Svx3dHandler.prototype.getLineSegments = function () {

	var lineSegments = [];
	var groups       = this.groups;

	for ( var i = 0, l = groups.length; i < l; i++ ) {

		var g = groups[ i ];

		for ( var v = 0, vMax = g.length - 1; v < vMax; v++ ) {

			// create vertex pairs for each line segment.
			// all vertices except first and last are duplicated.
			var from = g[ v ];
			var to   = g[ v + 1 ];

			lineSegments.push( { from: from.coords, to: to.coords, type: to.type, survey: to.survey } );

		}
	}

	return lineSegments;

}

Svx3dHandler.prototype.getTerrainDimensions = function () {

	return { lines: 0, samples: 0 };

}

Svx3dHandler.prototype.getTerrainBitmap = function () {

	return false;

}

Svx3dHandler.prototype.getSurvey = function () {

	return {
		title: this.fileName,
		surveyTree: this.surveyTree,
		lineSegments: this.getLineSegments(),
		crossSections: this.xGroups,
		scraps: [],
		entrances: this.entrances,
		hasTerrain: false
	}

}

export { Svx3dHandler };

// EOF