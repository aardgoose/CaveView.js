// Survex 3d file mangler
const fs = require('fs');

function Svx3dEditor ( dataStream ) {

	var source    = new Buffer( dataStream );  // file data as RW arrrayBuffer 
	var pos       = 0;	         // file position

	// read file header
	readLF(); // Survex 3D Image File
	var version   = readLF();
	var title     = readLF();

	console.log( "version: ", version) ;
	console.log( "title: ", title) ;

	var fd = fs.openSync( "new.3d", 'w' );

	fs.writeSync( fd, "Survex 3D Image File\n");
	fs.writeSync( fd, new Buffer( version ), 0, version.length );

	title.pop(); // remove line feed
	title.push( 0x00 ); // add null

	fs.writeSync( fd, new Buffer( title ), 0, title.length );
	fs.writeSync( fd, "+init=epsg:27700 +no_defs\n" );
//	fs.writeSync( fd, "+proj=longlat +ellps=WGS84 +datum=WGS84\n" );

	fs.writeSync( fd, source, pos, source.length - pos );

	fs.closeSync( fd );

	return;

	function readLF () { // read until Line feed

		var bytes = new Uint8Array( source, 0 );
		var lfString = [];

		var b;

		do {

			b = bytes[ pos++ ];
			lfString.push( b );

		} while ( b != 0x0a )

		return lfString;

	}

}

Svx3dEditor.prototype.constructor = Svx3dEditor;


var buffer = fs.readFileSync( "Bradwell_Master.3d");

var e = new Svx3dEditor( buffer );

// EOF