// Survex 3d file handler

import { LEG_CAVE, LEG_SPLAY, LEG_SURFACE, STATION_NORMAL, STATION_ENTRANCE } from '../core/constants';
import { Tree } from '../core/Tree';

function Svx3dHandler ( fileName, dataStream, metadata ) {

	this.fileName   = fileName;
	this.groups     = [];
	this.surface    = [];
	this.xGroups    = [];
	this.surveyTree = new Tree();
	this.isRegion   = false;
	this.sourceCRS  = null;
	this.targetCRS  = 'EPSG:3857'; // "web mercator"
	this.projection = null;
	this.metadata   = metadata;

	var source    = dataStream;  // file data as arrrayBuffer
	var pos       = 0;	         // file position

	// read file header

	readLF(); // Survex 3D Image File
	var version = readLF(); // 3d version
	var auxInfo = readNSLF();
	readLF(); // Date

	var sourceCRS = ( auxInfo[ 1 ] === undefined ) ? null : auxInfo[ 1 ]; // coordinate reference system ( proj4 format )

	if ( sourceCRS !== null ) {

		// work around lack of +init string support in proj4js

		var matches = sourceCRS.match( /\+init=(.*)\s/);

		if ( matches && matches.length === 2 ) {

			switch( matches[ 1 ] ) {

			case 'epsg:27700' :

				sourceCRS = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs';

				break;

			default:

				sourceCRS = null;
				console.warn( 'unsupported projection' );

			}

		}

	}

	// FIXME use NAD grid corrections OSTM15 etc ( UK Centric )

	if ( sourceCRS !== null ) {

		console.log( 'Reprojecting from', sourceCRS, 'to', this.targetCRS );

		this.sourceCRS = sourceCRS;
		this.projection = proj4( this.sourceCRS, this.targetCRS ); // eslint-disable-line no-undef

	}

	console.log( 'Survex .3d version ', version );

	switch ( version ) {

	case 'Bv0.01':

		this.handleOld( source, pos, 1 );

		break;

	case 'v3':
	case 'v4':
	case 'v5':
	case 'v6':
	case 'v7':
	case 'v8':

		this.handleVx( source, pos, Number( version.charAt( 1 ) ) );

		break;

	default:

		alert( 'unknown .3d version ' + version );

	}

	return;

	function readLF () { // read until Line feed

		return readNSLF()[ 0 ];

	}

	function readNSLF () { // read until Line feed and split by null bytes

		var bytes = new Uint8Array( source, 0 );

		var lfString = [];
		var b;
		var strings = [];

		do {

			b = bytes[ pos++ ];

			if ( b === 0x0a || b === 0 ) {

				strings.push( String.fromCharCode.apply( null, lfString ).trim() );
				lfString = [];

			} else {

				lfString.push( b );

			}

		} while ( b != 0x0a );

		return strings;

	}

}

Svx3dHandler.prototype.constructor = Svx3dHandler;

Svx3dHandler.prototype.handleOld = function ( source, pos, version ) {

	var groups     = this.groups;
	var surveyTree = this.surveyTree;

	var self = this;

	var cmd         = [];
	var legs        = [];
	var label       = '';
	var stations    = new Map();
	var sectionId   = 0;

	var data       = new Uint8Array( source, 0 );
	var dataLength = data.length;
	var lastPosition = { x: 0, y:0, z: 0 }; // value to allow approach vector for xsect coord frame
	var i, j, li, lj;

	var dataView = new DataView( source, 0 );

	// selected correct read coordinates function

	var readCoordinates = ( this.projection === null ) ? __readCoordinates : __readCoordinatesProjected;

	// range

	var min = { x: Infinity, y: Infinity, z: Infinity };
	var max = { x: -Infinity, y: -Infinity, z: -Infinity };

	// init cmd handler table withh  error handler for unsupported records or invalid records

	function _errorHandler ( e ) { console.warn( 'unhandled command: ', e.toString( 16 ) ); return false; }

	for ( i = 0; i < 256; i++ ) {

		cmd[ i ] = _errorHandler;

	}

	cmd[ 0x00 ] = cmd_STOP;
	cmd[   -1 ] = cmd_STOP;

	cmd[ 0x01 ] = cmd_SKIP;

	cmd[ 0x02 ] = cmd_LABEL_V1; // version numbers not related to Survex versions
	cmd[ 0x03 ] = cmd_LABEL_V1;

	cmd[ 0x04 ] = cmd_MOVE;
	cmd[ 0x05 ] = cmd_LINE_V1;

	cmd[ 0x06 ] = cmd_LABEL_V2;
	cmd[ 0x07 ] = cmd_LABEL_V3;

	for ( i = 0x40; i < 0x80; i++ ) {

		cmd[ i ] = cmd_LABEL_V4;

	}

	for ( i = 0x80; i < 0x100; i++ ) {

		cmd[ i ] = cmd_LINE_V2;

	}

	// dispatch table end

	// common record iterator
	// loop though data, handling record types as required.

	if ( version === 1 ) {

		while ( pos < dataLength ) {

			var cmdCode = dataView.getInt32( pos, true );
			pos += 4;

			if ( ! cmd[ cmdCode ]() ) break;

		}

	} else {

		alert( 'Unsupported version' + version );

		while ( pos < dataLength ) {

			if ( ! cmd[ data[ pos ] ]( data[ pos++ ] ) ) break;

		}

	}

	groups.push( legs );

	// assign survey ids to all leg vertices by looking up tree node for coords
	var group, leg, coords, node;

	for ( i = 0, li = groups.length; i < li; i++ ) {

		group = groups[ i ];

		for ( j = 0, lj = group.length; j < lj; j++ ) {

			leg = group[ j ];
			coords = leg.coords;

			node = stations.get( coords.x + ':' + coords.y + ':' + coords.z );

			if ( node === undefined ) continue;

			leg.survey = node.parent.id;

		}

	}

	var offsets = {
		x: ( min.x + max.x ) / 2,
		y: ( min.y + max.y ) / 2,
		z: ( min.z + max.z ) / 2
	};

	surveyTree.traverse( adjustCoords );

	this.offsets = offsets;

	this.limits = {
		min: min,
		max: max
	};

	return;

	function adjustCoords( node ) {

		var coords = node.p;

		if ( coords === undefined ) return;

		coords.x -= offsets.x;
		coords.y -= offsets.y;
		coords.z -= offsets.z;

	}


	function cmd_STOP ( /* c */ ) {

		if ( label ) label = '';

		return true;

	}

	function cmd_SKIP ( /* c */ ) {

		console.log( 'SKIP' );
		return false;

	}

	function cmd_LABEL_V1 ( /* c */ ) {

		var db = [];

		var nextByte = data[ pos++ ];

		while ( nextByte !== 10 ) {

			db.push( nextByte );
			nextByte = data[ pos++ ];

		}

		if ( db[ 0 ] === 92 ) db.shift(); // remove initial '/' characters

		label = String.fromCharCode.apply( null, db );
//		console.log( 'NODE', label, lastPosition );

		var node = surveyTree.addPath( label.split( '.' ), { p: lastPosition, type: STATION_NORMAL } );

		// track coords to sectionId to allow survey ID's to be added to leg vertices
		stations.set( lastPosition.x + ':' + lastPosition.y + ':' + lastPosition.z, node );

		return true;

	}

	function cmd_LABEL_V2 ( /* c */ ) {

		console.log( 'LABEL_V2' );
		return false;

	}

	function cmd_LABEL_V3 ( /* c */ ) {

		console.log( 'LABEL_V3' );
		return false;

	}
	function cmd_LABEL_V4 ( /* c */ ) {

		console.log( 'LABEL_V4' );
		return false;

	}

	function cmd_MOVE ( /* c */ ) {

		var coords = readCoordinates();


		lastPosition = coords;

		if ( version === 1 && dataView.getInt32( pos, true ) === 2 ) {

			// version 1 uses MOVE+LABEL pairs to label stations
			return true;

		}

//		console.log( 'MOVE', coords );

		if ( legs.length > 1 ) groups.push( legs );

		legs = [];

		legs.push( { coords: coords } );

		return true;

	}

	function cmd_LINE_V1 ( /* c */ ) {

		var coords = readCoordinates();

		legs.push( { coords: coords, type: LEG_CAVE, survey: sectionId } );

		lastPosition = coords;

//		console.log( 'LINE_V1', coords );

		return true;

	}

	function cmd_LINE_V2 ( /* c */ ) {

		console.log( 'LINE_V2' );
		return false;

	}

	// functions aliased at runtime as required

	function __readCoordinatesProjected () {

		var l = new DataView( source, pos );

		var projectedCoords = self.projection.forward( {
			x: l.getInt32( 0, true ) / 100,
			y: l.getInt32( 4, true ) / 100
		} );

		var coords = {
			x: projectedCoords.x,
			y: projectedCoords.y,
			z: l.getInt32( 8, true ) / 100
		};

		min.x = Math.min( coords.x, min.x );
		min.y = Math.min( coords.y, min.y );
		min.z = Math.min( coords.z, min.z );

		max.x = Math.max( coords.x, max.x );
		max.y = Math.max( coords.y, max.y );
		max.z = Math.max( coords.z, max.z );

		pos += 12;

		return coords;

	}

	function __readCoordinates () {

		var l = new DataView( source, pos );

		var coords = {
			x: l.getInt32( 0, true ) / 100,
			y: l.getInt32( 4, true ) / 100,
			z: l.getInt32( 8, true ) / 100
		};

		min.x = Math.min( coords.x, min.x );
		min.y = Math.min( coords.y, min.y );
		min.z = Math.min( coords.z, min.z );

		max.x = Math.max( coords.x, max.x );
		max.y = Math.max( coords.y, max.y );
		max.z = Math.max( coords.z, max.z );

		pos += 12;

		return coords;

	}

};

Svx3dHandler.prototype.handleVx = function ( source, pos, version ) {

	var groups     = this.groups;
	var xGroups    = this.xGroups;
	var surveyTree = this.surveyTree;

	var self = this;

	var cmd         = [];
	var legs        = [];
	var label       = '';
	var stations    = new Map();
	var lineEnds    = new Set(); // implied line ends to fixnup xsects
	var xSects      = [];
	var sectionId   = 0;
	var sectionLabels = new Set();

	var data       = new Uint8Array( source, 0 );
	var dataLength = data.length;
	var lastPosition = { x: 0, y:0, z: 0 }; // value to allow approach vector for xsect coord frame
	var i;
	var labelChanged = false;

	// functions

	var readLabel;

	// selected correct read coordinates function

	var readCoordinates = ( this.projection === null ) ? __readCoordinates : __readCoordinatesProjected;

	// range

	var min = { x: Infinity, y: Infinity, z: Infinity };
	var max = { x: -Infinity, y: -Infinity, z: -Infinity };

	// init cmd handler table withh  error handler for unsupported records or invalid records

	function _errorHandler ( e ) { console.warn( 'unhandled command: ', e.toString( 16 ) ); return false; }

	for ( i = 0; i < 256; i++ ) {

		cmd[ i ] = _errorHandler;

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

		// skip v8 file wide flags after header
		pos++;

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

		if ( ! cmd[ data[ pos ] ]( data[ pos++ ] ) ) break;

	}

	if ( xSects.length > 1 ) {

		xGroups.push( xSects );

	}

	groups.push( legs );

	var offsets = {
		x: ( min.x + max.x ) / 2,
		y: ( min.y + max.y ) / 2,
		z: ( min.z + max.z ) / 2
	};

	surveyTree.traverse( adjustCoords );

	this.offsets = offsets;

	this.limits = {
		min: min,
		max: max
	};

	return;

	function adjustCoords( node ) {

		var coords = node.p;

		if ( coords === undefined ) return;

		coords.x -= offsets.x;
		coords.y -= offsets.y;
		coords.z -= offsets.z;

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
			pos += 4;

			break;

		default:

			len = data[ pos++ ];

		}

		if ( len === 0 ) return;

		var db = [];

		for ( var i = 0; i < len; i++ ) {

			db.push( data[ pos++ ] );

		}

		label += String.fromCharCode.apply( null, db );
		labelChanged = true;

		return;

	}

	function readLabelV8 ( flags ) {

		if ( flags & 0x20 )  return false; // no label change

		var b = data[ pos++ ];
		var add = 0;
		var del = 0;
		var l;

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

				l = new DataView( source, pos );

				del = l.getUint32( 0, true );
				pos += 4;

			}

			b = data[ pos++ ];

			if ( b !== 0xff ) {

				add = b;

			} else {

				l = new DataView( source, pos );

				add = l.getUint32( 0, true );
				pos += 4;

			}
		}

		if ( add === 0 && del === 0 ) return;

		if ( del ) label = label.slice( 0, -del );

		if ( add ) {

			var db = [];

			for ( var i = 0; i < add; i++ ) {

				db.push( data[ pos++ ] );

			}

			label += String.fromCharCode.apply( null, db );

		}

		labelChanged = true;

		return;

	}

	function cmd_STOP ( /* c */ ) {

		if ( label ) label = '';

		return true;

	}

	function cmd_TRIM_PLUS ( c ) { // v7 and previous

		label = label.slice( 0, -16 );

		if ( label.charAt( label.length - 1 ) === '.') label = label.slice( 0, -1 ); // strip trailing '.'

		var parts = label.split( '.' );

		parts.splice( -( c ) );
		label = parts.join( '.' );

		if ( label ) label += '.';
		labelChanged = true;

		return true;

	}

	function cmd_TRIM ( c ) {  // v7 and previous

		var trim = c - 15;

		label = label.slice( 0, -trim );
		labelChanged = true;

		return true;

	}

	function cmd_DATE_V4 ( /* c */ ) {

		pos += 4;

		return true;

	}

	function cmd_DATE_V7 ( /* c */ ) {

		pos += 2;

		return true;

	}

	function cmd_DATE3_V7 ( /* c */ ) {

		pos += 4;

		return true;

	}

	function cmd_DATE2_V4 ( /* c */ ) {

		pos += 8;

		return true;

	}

	function cmd_DATE2_V7 ( /* c */ ) {

		pos += 3;

		return true;

	}

	function cmd_STYLE ( /* c */ ) {

		return true;

	}

	function cmd_DATEV8_1 ( /* c */ ) {

		pos += 2;

		return true;

	}

	function cmd_DATEV8_2 ( /* c */ ) {

		pos += 3;

		return true;

	}

	function cmd_DATEV8_3 ( /* c */ ) {

		pos += 4;

		return true;
	}

	function cmd_DATE_NODATE ( /* c */ ) {

		return true;

	}

	function cmd_LINE ( c ) {

		var flags = c & 0x3f;

		readLabel( flags );

		if ( labelChanged && label !== '' ) {

			// we have a new section name

			var path = label.split( '.' );

			var partLabel = path[ 0 ];

			// save valid survey station prefixes

			sectionLabels.add( partLabel );

			for ( var i = 1, l = path.length; i < l; i++ ) {

				partLabel = partLabel + '.' + path[ i ];
				sectionLabels.add( partLabel );

			}

			// add it to the survey tree
			sectionId = surveyTree.addPath( path ).id; // consumes path

			labelChanged = false;

		}

		var coords = readCoordinates();

		if ( flags & 0x01 ) {

			legs.push( { coords: coords, type: LEG_SURFACE, survey: sectionId } );

		} else if ( flags & 0x04 ) {

			legs.push( { coords: coords, type: LEG_SPLAY, survey: sectionId } );

		} else {

			legs.push( { coords: coords, type: LEG_CAVE, survey: sectionId } );

		}

		lastPosition = coords;

		return true;

	}

	function cmd_MOVE ( /* c */ ) {

		// new set of line segments
		if ( legs.length > 1 ) groups.push( legs );

		legs = [];

		// heuristic to detect line ends. lastPosition was presumably set in a line sequence therefore is at the end
		// of a line, Add the current label, presumably specified in the last LINE, to a Set of lineEnds.

		lineEnds.add( lastPosition.x + ':' + lastPosition.y + ':' + lastPosition.z );

		var coords = readCoordinates();

		legs.push( { coords: coords } );

		lastPosition = coords;

		return true;

	}

	function cmd_ERROR ( /* c */ ) {

		/*

		var l = new DataView( source, pos );

		var legs = l.getInt32( 0, true );
		var length = l.getInt32( 4, true );

		var E = l.getInt32( 8, true );
		var H = l.getInt32( 12, true );
		var V = l.getInt32( 16, true );

		*/

		pos += 20;

		return true;

	}

	function cmd_LABEL ( c ) {

		var flags = c & 0x7f;

		readLabel( 0 );

		if ( ! ( flags & 0x0E ) || flags & 0x20 ) { // skip surface only stations

			pos += 12; //skip coordinates
			return true;

		}

		var coords = readCoordinates();

		var path = label.split( '.' );

		var prefix = path.slice( 0, -1 ).join( '.' );

		if ( path.length > 1 && ! sectionLabels.has( prefix ) ) {

			// handle station names containing separator character

			var i = 0;
			var test = path[ i ];

			while ( sectionLabels.has( test ) ) {

				test = test + '.' + path[ ++ i ];

			}

			var last = path.slice( i ).join( '.' );

			path = path.slice( 0, i );
			path.push( last );

		}

		stations.set( label, coords );

		surveyTree.addPath( path, { p: coords, type: ( flags & 0x04 ) ? STATION_ENTRANCE : STATION_NORMAL } );

		return true;

	}

	function cmd_XSECT16 ( c ) {

		var flags = c & 0x01;

		readLabel( flags );

		var l = new DataView( source, pos );

		pos += 8;

		return commonXSECT(
			flags,
			{
				l: l.getInt16( 0, true ) / 100,
				r: l.getInt16( 2, true ) / 100,
				u: l.getInt16( 4, true ) / 100,
				d: l.getInt16( 6, true ) / 100
			}
		);

	}

	function cmd_XSECT32 ( c ) {

		var flags = c & 0x01;

		readLabel( flags );

		var l = new DataView( source, pos );

		pos += 16;

		return commonXSECT(
			flags,
			{
				l: l.getInt32( 0, true ) / 100,
				r: l.getInt32( 0, true ) / 100,
				u: l.getInt32( 0, true ) / 100,
				d: l.getInt32( 0, true ) / 100
			}
		);

	}

	function commonXSECT ( flags, lrud ) {

		var position = stations.get( label );

		if ( ! position ) return;

		var station = label.split( '.' );

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

		var endRun = false;

		if ( flags ) {

			endRun = true;

		} else if ( lineEnds.has( [ position.x, position.y, position.z ].toString() ) ) {

			endRun = true;
//			console.warn( 'unterminated LRUD passage at ', label );

		}

		if ( endRun ) {

			if ( xSects.length > 0 ) xGroups.push( xSects );

			lastPosition = { x: 0, y: 0, z: 0 };
			xSects = [];

		}

		return true;

	}

	// functions aliased at runtime as required

	function __readCoordinatesProjected () {

		var l = new DataView( source, pos );

		var projectedCoords = self.projection.forward( {
			x: l.getInt32( 0, true ) / 100,
			y: l.getInt32( 4, true ) / 100
		} );

		var coords = {
			x: projectedCoords.x,
			y: projectedCoords.y,
			z: l.getInt32( 8, true ) / 100
		};

		min.x = Math.min( coords.x, min.x );
		min.y = Math.min( coords.y, min.y );
		min.z = Math.min( coords.z, min.z );

		max.x = Math.max( coords.x, max.x );
		max.y = Math.max( coords.y, max.y );
		max.z = Math.max( coords.z, max.z );

		pos += 12;

		return coords;

	}

	function __readCoordinates () {

		var l = new DataView( source, pos );

		var coords = {
			x: l.getInt32( 0, true ) / 100,
			y: l.getInt32( 4, true ) / 100,
			z: l.getInt32( 8, true ) / 100
		};

		min.x = Math.min( coords.x, min.x );
		min.y = Math.min( coords.y, min.y );
		min.z = Math.min( coords.z, min.z );

		max.x = Math.max( coords.x, max.x );
		max.y = Math.max( coords.y, max.y );
		max.z = Math.max( coords.z, max.z );

		pos += 12;

		return coords;

	}

};

Svx3dHandler.prototype.getLineSegments = function () {

	var lineSegments = [];
	var groups = this.groups;
	var offsets = this.offsets;

	for ( var i = 0, l = groups.length; i < l; i++ ) {

		var g = groups[ i ];

		for ( var v = 0, vMax = g.length - 1; v < vMax; v++ ) {

			// create vertex pairs for each line segment.
			// all vertices except first and last are duplicated.
			var from = g[ v ];
			var to   = g[ v + 1 ];


			// move coordinates around origin

			from.coords.x -= offsets.x;
			from.coords.y -= offsets.y;
			from.coords.z -= offsets.z;

			var fromCoords = from.coords;
			var toCoords = to.coords;

			// skip repeated points ( co-located stations )
			if ( fromCoords.x === toCoords.x && fromCoords.y === toCoords.y && fromCoords.z === toCoords.z ) continue;

			lineSegments.push( { from: fromCoords, to: toCoords, type: to.type, survey: to.survey } );

		}

		// move coordinates around origin

		to.coords.x -= offsets.x;
		to.coords.y -= offsets.y;
		to.coords.z -= offsets.z;

	}

	return lineSegments;

};

Svx3dHandler.prototype.getTerrainDimensions = function () {

	return { lines: 0, samples: 0 };

};

Svx3dHandler.prototype.getTerrainBitmap = function () {

	return false;

};

Svx3dHandler.prototype.getSurvey = function () {

	return {
		title: this.fileName,
		surveyTree: this.surveyTree,
		sourceCRS: this.sourceCRS,
		targetCRS: this.targetCRS,
		limits: this.limits,
		offsets: this.offsets,
		lineSegments: this.getLineSegments(),
		crossSections: this.xGroups,
		scraps: [],
		hasTerrain: false,
		metadata: this.metadata
	};

};

export { Svx3dHandler };

// EOF