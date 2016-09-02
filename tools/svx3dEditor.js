// Survex 3d file mangler
const fs = require('fs');

function Svx3dEditor ( dataStream ) {

	var source    = new Buffer( dataStream );  // file data as RW arrrayBuffer 
	var pos       = 0;	         // file position

	// read file header
	readLF(); // Survex 3D Image File
	var version   = readLF(); // 3d version
	var title     = readLF(); // Title
	readLF(); // Date

	console.log( "title: ", title) ;

	this.handleVx( source, pos, Number( version.charAt( 1 ) ) );

	return;

	function readLF () { // read until Line feed

		var bytes = new Uint8Array( source, 0 );

		var lfString = [];
		var b;

		do {

			b = bytes[ pos++ ];
			lfString.push( b );

		} while ( b != 0x0a && b != 0x00 )

		var s = String.fromCharCode.apply( null, lfString ).trim();

		console.log( s  );

		return s;
	}
}

Svx3dEditor.prototype.constructor = Svx3dEditor;


Svx3dEditor.prototype.handleVx = function ( source, pos, version ) {

	var cmd         = [];
	var legs        = [];
	var label       = "";
	var readLabel;
	var fileFlags   = 0;

	var data       = new Uint8Array( source, 0 );
	var dataLength = data.length;
	var i;

	var region = {
		title: "Peak District Caves",
		caves: {}
	};

	// init cmd handler table withh  error handler for unsupported records or invalid records

	for ( i = 0; i < 256; i++ ) {

		cmd[ i ] = function ( e ) { console.log ( 'unhandled command: ', e.toString( 16 ) ); return false; };	

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

	var fd;
	var start = pos;
	var surface = false;
	var move = false;
	var lastMove = 0;

	var cave;
	var caves = {};
	var newCmd;
	var entrance = false;

	while ( pos < dataLength ) {

		start = pos;

		newCmd = null;

		if ( cmd[ data[ pos ] ]( data[ pos++ ] ) ) {

			caveName = label.split( "." )[ 1 ];

			if ( caveName !== undefined && ! surface ) {

				if ( caves[ caveName ] === undefined ) {

					fd = writeHeader( caveName + ".3d", caveName );

					caves[ caveName ] = {
						fd: fd,
						lastLabel: null,
						surfaceLeg: false
					};

				}

			}

			cave = caves[ caveName ];

			if ( move ) {

				// defer move until we know which file it is destined for
				move = false;
				lastMove = start;

			} else {

				if ( cave ) {

					if ( lastMove ) {

						// write deferred move
						fs.writeSync( cave.fd, source, lastMove, start - lastMove );

					}

					//	console.log(" write @ ", start, " len ", pos - start );
					cave.lastLabel = label;

					if ( newCmd === null ) {

						fs.writeSync( cave.fd, source, start, pos - start );

					} else {

						// replace command with new command to correct initial label
						fs.writeSync( cave.fd, new Buffer( newCmd ), 0, newCmd.length );	// new LINE with new LABEL

					}

				}

				lastMove = 0;

			}

		}

	}

	// close all cave files

	for ( name in caves ) { 

		cave = caves[ name ];

		newCmd = [];

		newCmd.push( 0xA0 ); // anonymous label
		newCmd.push( 0x00 );
		newCmd.push( cave.lastLabel.length );
		newCmd.push( 0x00 );

		// fake coordinates

		for ( var i = 0; i < 6; i++ ) {

			newCmd.push( 0xCA );
			newCmd.push( 0xFE );

		}

		fs.writeSync( cave.fd, new Buffer( newCmd ), 0, newCmd.length );

		fs.writeSync( cave.fd, new Buffer( [ 0x00 ] ), 0, 1 ); // style = NORMAL
		fs.writeSync( cave.fd, new Buffer( [ 0x00 ] ), 0, 1 ); // EOF

		fs.closeSync( cave.fd );

	}

	console.log ( "END l : ", dataLength, " pos: ", pos, " start: ", start );

	fs.writeFileSync( "region.js", JSON.stringify( region ) );

	return;

	function writeHeader( name, title ) {

		var fd = fs.openSync( name, 'w' );
		var lf = new Buffer( [ 0x0a ] );

		fs.writeSync( fd, "Survex 3D Image File\n");
		fs.writeSync( fd, "v8\n");
		fs.writeSync( fd, title + "\n" );
		fs.writeSync( fd, "@1371300355\n" );

		fs.writeSync( fd, new Buffer( [ 0x00 ] ), 0, 1 );

		return fd;
	}

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

		var oldCaveName = label.split( "." )[1];
		var oldLabel    = label;

		var startOfCmd = pos - 1;

		var b = data[ pos++ ];
		var add = 0;
		var del = 0;
		var i;

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

			for ( i = 0; i < add; i++ ) {

				db.push( data[pos++] );

			}
 
			label = label + String.fromCharCode.apply( null, db );

		}

		var caveName = label.split( "." )[ 1 ];

		if (  caves[ caveName ] === undefined  ) {

			// insert new label and add coordinates
			newCmd = [];

			newCmd.push( data[ startOfCmd ] );
			newCmd.push( 0x00 ); 			// 4 bit coding 

			// delete label count

			newCmd.push( 0x00 );

			// add label count

			newCmd.push( label.length );

			for ( i = 0; i < label.length; i++ ) {

				newCmd.push(  label.charCodeAt( i ) );

			}

			// copy xyz coordinates following the orignal command

			for ( i = 0; i < 12; i++ ) {

				newCmd.push( data[ pos + i ] );

			}

		} else if ( add && caveName != oldCaveName ) {

			var cave = caves[ caveName ];

		//	console.log(" oc: ", oldCaveName, " nc: ", caveName );

			// insert fake record to correct label buffer

			newCmd = [];

			newCmd.push( 0xA0 ); // anonymouus label
			newCmd.push( 0x00 );
			newCmd.push( cave.lastLabel.length );
			newCmd.push( oldLabel.length );

			for ( i = 0; i < oldLabel.length; i++ ) {

				newCmd.push(  oldLabel.charCodeAt( i ) );

			}

			// fake coordinates

			for ( i = 0; i < 6; i++ ) {

				newCmd.push( 0xDE );
				newCmd.push( 0xAD );

			}

			fs.writeSync( cave.fd, new Buffer( newCmd ), 0, newCmd.length );

			newCmd = null; // don't replace current command'

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

	function cmd_DATE2_V4 ( c ) {

		pos += 8;

		return true;

	}

	function cmd_DATE2_V7 ( c ) {

		pos += 3;

		return true;

	}

	function cmd_STYLE ( c ) {

		return true;

	}

	function cmd_DATEV8_1 ( c ) {

		pos += 2;

		return true;

	}

	function cmd_DATEV8_2 ( c ) {

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

		//surface = flags & 0x01;

		readLabel( flags );

		readCoordinates( flags );

		return true;

	}

	function cmd_MOVE ( c ) {

		readCoordinates( 0x00 )
		move = true;
		return true;

	}

	function cmd_ERROR ( c ) {

		pos += 20;

		return true;

	}

	function cmd_LABEL ( c ) {

		var flags = c & 0x7f;

		entrance = flags & 0x04;
		//surface = flags & 0x01;

		readLabel( 0 );

		readCoordinates( flags );

/*
		if ( c & 0x04 ) {

			var station = label.split( "." );

			// get survey path by removing last component of station name
			station.pop();

		}
*/
		return true;

	}

	function cmd_XSECT16 ( c ) {

		var flags = c & 0x01;

		entrance = false;
		readLabel( flags );

		pos += 8;

		return commonXSECT( flags );

	}

	function cmd_XSECT32 ( c ) {

		var flags = c & 0x01;

		entrance = false;
		readLabel( flags );

		pos += 16;

		return commonXSECT( flags );

	}

	function commonXSECT( flags ) {

//		var station = label.split( "." );
//		station.pop();

		return true;

	}

	function readCoordinates ( flags ) {

		if ( entrance ) {

			var entranceObj = {

				label: label,
				position : {
					x: source.readInt32LE( pos + 0, true ) / 100,
					y: source.readInt32LE( pos + 4, true ) / 100,
					z: source.readInt32LE( pos + 8, true ) / 100
				}

			};

			console.log("Entrance @ ", entranceObj );

			var name = label.split( "." )[1];

			if ( region.caves[ name ] === undefined ) {

				region.caves[ name ] = { entrances: [] };

			}

			region.caves[ name ].entrances.push( entranceObj );

		}

		pos += 12;

		return true;

	}

}

var buffer = fs.readFileSync( "Peak_Master.3d");

var e = new Svx3dEditor( buffer );

// EOF