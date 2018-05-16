// Survex 3d file handler

import { LEG_CAVE, LEG_SPLAY, LEG_SURFACE, STATION_NORMAL, STATION_ENTRANCE, WALL_SQUARE } from '../core/constants';
import { Tree } from '../core/Tree';
import { Cfg } from '../core/lib';
import { StationPosition } from '../core/StationPosition';
import { Vector3, Box3 } from '../Three';

function Svx3dHandler ( fileName ) {

	this.fileName   = fileName;
	this.groups     = [];
	this.surface    = [];
	this.xGroups    = [];
	this.surveyTree = new Tree();
	this.sourceCRS  = null;
	this.targetCRS  = 'EPSG:3857'; // "web mercator"
	this.displayCRS = null;
	this.projection = null;
	this.stationMap = new Map();

}

Svx3dHandler.prototype.constructor = Svx3dHandler;

Svx3dHandler.prototype.type = 'arraybuffer';

Svx3dHandler.prototype.parse = function ( dataStream, metadata, section ) {

	this.metadata = metadata;

	var pos = 0; // file position

	// read file header

	readLF(); // Survex 3D Image File
	const version = readLF(); // 3d version
	const auxInfo = readNSLF();
	readLF(); // Date

	var sourceCRS = ( auxInfo[ 1 ] === undefined ) ? null : auxInfo[ 1 ]; // coordinate reference system ( proj4 format )

	if ( sourceCRS !== null ) {

		// work around lack of +init string support in proj4js

		const matches = sourceCRS.match( /\+init=(.*)\s/);

		if ( matches && matches.length === 2 ) {

			switch( matches[ 1 ] ) {

			case 'epsg:27700' :

				sourceCRS = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs';

				break;

			default:

				console.warn( 'unsupported projection' );

			}

		}

	}

	const displayCRS = Cfg.value( 'displayCRS' , 'ORIGINAL' );

	if ( sourceCRS === null ) sourceCRS = Cfg.value( 'defaultCRS' , null );

	// FIXME use NAD grid corrections OSTM15 etc ( UK Centric )
	if ( sourceCRS !== null ) {

		this.sourceCRS = sourceCRS;

		if ( displayCRS  === 'ORIGINAL' ) {

			this.displayCRS = 'ORIGINAL';

		} else {

			console.log( 'Reprojecting from', sourceCRS, 'to', this.targetCRS );

			this.projection = proj4( this.sourceCRS, this.targetCRS ); // eslint-disable-line no-undef
			this.displayCRS = this.targetCRS;

		}

	}

	console.log( 'Survex .3d version ', version );

	switch ( version ) {

	case 'Bv0.01':

		this.handleOld( dataStream, pos, 1 );

		break;

	case 'v3':
	case 'v4':
	case 'v5':
	case 'v6':
	case 'v7':
	case 'v8':

		this.handleVx( dataStream, pos, Number( version.charAt( 1 ) ), section );

		break;

	default:

		alert( 'unknown .3d version ' + version );

	}

	const surveyTree = this.surveyTree;

	if ( section !== null ) {

		surveyTree.trim( section.split( '.' ) );

	}

	const stationMap = this.stationMap;
	const limits = new Box3();
	const projection = this.projection;

	// get bounding box of all stations in survey

	if ( projection === null ) {

		stationMap.forEach( getLimits );

	} else {

		stationMap.forEach( getLimitsProjected );

	}

	const offsets = limits.getCenter( new Vector3() );

	// adjust coordinates to be centered on ( 0, 0, 0 )

	stationMap.forEach( adjustCoords );

	const min = limits.min;
	const max = limits.max;

	// expand survey area by 10%

	limits.expandByVector(

		new Vector3(
			( max.x - min.x ) * 0.05,
			( max.y - min.y ) * 0.05,
			0
		)

	);

	this.limits = limits;
	this.offsets = offsets;

	return this;

	function getLimits ( coords ) {

		limits.expandByPoint( coords );

	}

	function getLimitsProjected ( coords ) {

		const projectedCoords = projection.forward( {
			x: coords.x,
			y: coords.y
		} );

		coords.x = projectedCoords.x;
		coords.y = projectedCoords.y;

		limits.expandByPoint( coords );

	}

	function adjustCoords ( coords ) {

		coords.sub( offsets );

	}

	function readLF () { // read until Line feed

		return readNSLF()[ 0 ];

	}

	function readNSLF () { // read until Line feed and split by null bytes

		const bytes = new Uint8Array( dataStream, 0 );
		const strings = [];

		var lfString = [];
		var b;

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

};

Svx3dHandler.prototype.handleOld = function ( source, pos, version ) {

	const groups     = this.groups;
	const surveyTree = this.surveyTree;
	const stationMap = this.stationMap;

	const cmd       = [];
	const stations  = new Map();

	const dataView   = new DataView( source, 0 );
	const data       = new Uint8Array( source, 0 );
	const dataLength = data.length;

	var label       = '';
	var sectionId   = 0;
	var legs        = [];

	var lastPosition = new StationPosition(); // value to allow approach vector for xsect coord frame
	var i, j, li, lj;

	// init cmd handler table with error handler for unsupported records or invalid records

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

			const cmdCode = dataView.getInt32( pos, true );
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

	for ( i = 0, li = groups.length; i < li; i++ ) {

		const group = groups[ i ];

		for ( j = 0, lj = group.length; j < lj; j++ ) {

			const leg = group[ j ];
			const coords = leg.coords;

			const node = stations.get( coords );

			if ( node === undefined ) continue;

			leg.survey = node.parent.id;

		}

	}

	function cmd_STOP ( /* c */ ) {

		return true;

	}

	function cmd_SKIP ( /* c */ ) {

		console.log( 'SKIP' );
		return false;

	}

	function cmd_LABEL_V1 ( /* c */ ) {

		const db = [];

		var nextByte = data[ pos++ ];

		while ( nextByte !== 10 ) {

			db.push( nextByte );
			nextByte = data[ pos++ ];

		}

		if ( db[ 0 ] === 92 ) db.shift(); // remove initial '/' characters

		label = String.fromCharCode.apply( null, db );

		var node = surveyTree.addPath( label.split( '.' ), { p: lastPosition, type: STATION_NORMAL } );

		// track coords to sectionId to allow survey ID's to be added to leg vertices
		stations.set( lastPosition, node );

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

		const coords = readCoordinates();

		lastPosition = coords;

		// lookahead at next command
		if ( version === 1 && dataView.getInt32( pos, true ) === 2 ) {

			// version 1 uses MOVE+LABEL pairs to label stations
			return true;

		}

		if ( legs.length > 1 ) groups.push( legs );

		legs = [];

		legs.push( { coords: coords } );

		return true;

	}

	function cmd_LINE_V1 ( /* c */ ) {

		const coords = readCoordinates();

		legs.push( { coords: coords, type: LEG_CAVE, survey: sectionId } );

		lastPosition.connections++;
		coords.connections++;

		lastPosition = coords;

		return true;

	}

	function cmd_LINE_V2 ( /* c */ ) {

		console.log( 'LINE_V2' );
		return false;

	}

	function readCoordinates () {

		const l = new DataView( source, pos );

		var coords = new StationPosition(
			l.getInt32( 0, true ) / 100,
			l.getInt32( 4, true ) / 100,
			l.getInt32( 8, true ) / 100
		);

		pos += 12;

		const key = coords.x + ',' + coords.y + ',' + coords.z;
		const cachedCoords = stationMap.get( key );

		if ( cachedCoords !== undefined ) {

			coords = cachedCoords;

		} else {

			stationMap.set( key, coords );

		}

		return coords;

	}

};

Svx3dHandler.prototype.handleVx = function ( source, pos, version, section ) {

	const groups     = this.groups;
	const xGroups    = this.xGroups;
	const surveyTree = this.surveyTree;
	const stationMap = this.stationMap;

	const cmd = [];

	const sectionLabels = new Set();
	const stations      = new Map();

	const data       = new Uint8Array( source, 0 );
	const dataLength = data.length;

	var legs      = [];
	var label     = '';
	var xSects    = [];
	var sectionId = 0;

	var move = false;
	var lastPosition = new StationPosition();
	var lastXSectPosition = new Vector3(); // value to allow approach vector for xsect coord frame
	var i;
	var labelChanged = false;
	var inSection = ( section === null );

	// functions

	var readLabel;

	// init cmd handler table with error handler for unsupported records or invalid records

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

	// fake approach vector for initial leg in xSect sequence

	for ( i = 0; i < xGroups.length; i ++ ) {

		const group = xGroups[ i ];

		if ( group.length < 2 ) continue;

		const x1 = group[ 0 ];
		const x2 = group[ 1 ];

		// mirror vector from first to second leg
		const start = x1.end;
		const end = x2.end;

		const newStart = new Vector3().copy( start ).multiplyScalar( 2 ).sub( end );

		x1.start = newStart;

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
			pos += 4;

			break;

		default:

			len = data[ pos++ ];

		}

		if ( len === 0 ) return;

		const db = [];

		for ( var i = 0; i < len; i++ ) {

			db.push( data[ pos++ ] );

		}

		label += String.fromCharCode.apply( null, db );
		labelChanged = true;

		if ( section !== null ) inSection = label.startsWith( section );

		return;

	}

	function readLabelV8 ( flags ) {

		if ( flags & 0x20 ) return false; // no label change

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

			let db = [];

			for ( var i = 0; i < add; i++ ) {

				db.push( data[ pos++ ] );

			}

			label += String.fromCharCode.apply( null, db );

		}

		labelChanged = true;

		if ( section !== null ) inSection = label.startsWith( section );

		return;

	}

	function cmd_STOP ( /* c */ ) {

		if ( label ) label = '';

		return true;

	}

	function cmd_TRIM_PLUS ( c ) { // v7 and previous

		label = label.slice( 0, -16 );

		if ( label.charAt( label.length - 1 ) === '.') label = label.slice( 0, -1 ); // strip trailing '.'

		const parts = label.split( '.' );

		parts.splice( -( c ) );
		label = parts.join( '.' );

		if ( label ) label += '.';
		labelChanged = true;

		return true;

	}

	function cmd_TRIM ( c ) { // v7 and previous

		const trim = c - 15;

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

		const flags = c & 0x3f;

		readLabel( flags );

		if ( labelChanged && label !== '' ) {

			// we have a new section name

			const path = label.split( '.' );

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

		if ( inSection ) {

			// add start of run of legs
			if ( move ) {

				legs.push( { coords: lastPosition } );
				move = false;

			}

			const thisPosition = readCoordinates();

			if ( thisPosition === lastPosition ) return true;

			if ( flags & 0x01 ) {

				legs.push( { coords: thisPosition, type: LEG_SURFACE, survey: sectionId } );

			} else if ( flags & 0x04 ) {

				legs.push( { coords: thisPosition, type: LEG_SPLAY, survey: sectionId } );

			} else {

				// reference count underground legs ignoring splay and surface legs
				// used for topology reconstruction

				lastPosition.connections++;
				thisPosition.connections++;

				legs.push( { coords: thisPosition, type: LEG_CAVE, survey: sectionId } );

			}

			lastPosition = thisPosition;

		} else {

			if ( move ) {

				dropCoordinates( lastPosition );
				move = false;

			}

			// skip coordinates
			pos += 12;

		}

		return true;

	}

	function cmd_MOVE ( /* c */ ) {

		// new set of line segments
		if ( legs.length > 1 ) groups.push( legs );

		legs = [];

		if ( ! inSection && move ) dropCoordinates( lastPosition );

		lastPosition = readCoordinates();

		move = true;

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

		const flags = c & 0x7f;

		readLabel( 0 );

		if ( ( ! ( flags & 0x0E ) || flags & 0x20 ) || ! inSection ) { // skip surface only stations

			pos += 12; //skip coordinates
			return true;

		}

		const coords = readCoordinates();

		var path = label.split( '.' );
		const prefix = path.slice( 0, -1 ).join( '.' );

		if ( path.length > 1 && ! sectionLabels.has( prefix ) ) {

			// handle station names containing separator character

			let i = 0;
			let test = path[ i ];

			while ( sectionLabels.has( test ) ) {

				test = test + '.' + path[ ++ i ];

			}

			const last = path.slice( i ).join( '.' );

			path = path.slice( 0, i );
			path.push( last );

		}

		stations.set( label, coords );

		surveyTree.addPath( path, { p: coords, type: ( flags & 0x04 ) ? STATION_ENTRANCE : STATION_NORMAL } );

		return true;

	}

	function cmd_XSECT16 ( c ) {

		const flags = c & 0x01;

		readLabel( flags );

		const l = new DataView( source, pos );

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

		const flags = c & 0x01;

		readLabel( flags );

		const l = new DataView( source, pos );

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

		if ( section !== null && ! label.startsWith( section ) ) return true;

		const position = stations.get( label );

		if ( ! position ) {
			// console.warn( 'missing station in XSECT :', label );
			return true;
		}

		const station = label.split( '.' );

		// get survey path by removing last component of station name
		station.pop();

		const surveyId = surveyTree.getIdByPathArray( station );

		xSects.push( { start: lastXSectPosition, end: position, lrud: lrud, survey: surveyId, type: WALL_SQUARE } );

		lastXSectPosition = position;

		// some XSECTS are not flagged as last in passage
		// if a station has only one connection and is not the first in a set of XSECTS
		// it is at the end of a run of legs. Add a break to remove flyback artifacts

		var endRun = false;

		if ( flags ) {

			endRun = true;

		} else if ( position.connections === 1 && xSects.length > 1 ) {

			endRun = true;
			// console.log( 'unterminated LRUD passage at ', label, 'ref count ', position.connections );

		}

		if ( endRun ) {

			if ( xSects.length > 0 ) xGroups.push( xSects );

			lastXSectPosition = new Vector3();
			xSects = [];

		}

		return true;

	}

	function readCoordinates () {

		const l = new DataView( source, pos );

		var coords = new StationPosition(
			l.getInt32( 0, true ) / 100,
			l.getInt32( 4, true ) / 100,
			l.getInt32( 8, true ) / 100
		);

		pos += 12;

		const key = coords.x + ',' + coords.y + ',' + coords.z;
		const cachedCoords = stationMap.get( key );

		if ( cachedCoords !== undefined ) {

			coords = cachedCoords;

		} else {

			stationMap.set( key, coords );

		}

		return coords;

	}

	function dropCoordinates ( coords ) {

		stationMap.delete( coords.x + ',' + coords.y + ',' + coords.z );

	}

};

Svx3dHandler.prototype.getLineSegments = function () {

	const lineSegments = [];
	const groups = this.groups;

	for ( var i = 0, l = groups.length; i < l; i++ ) {

		const g = groups[ i ];

		for ( var v = 0, vMax = g.length - 1; v < vMax; v++ ) {

			// create vertex pairs for each line segment.
			// all vertices except first and last are duplicated.
			const from = g[ v ];
			const to   = g[ v + 1 ];

			const fromCoords = from.coords;
			const toCoords = to.coords;

			lineSegments.push( { from: fromCoords, to: toCoords, type: to.type, survey: to.survey } );

		}

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
		displayCRS: this.displayCRS,
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