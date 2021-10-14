import {
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE, LEG_DUPLICATE,
	STATION_NORMAL, STATION_ENTRANCE, STATION_XSECT,
	WALL_SQUARE
} from '../core/constants';
import { StationPosition } from '../core/StationPosition';

function Svx3dHandler ( fileName ) {

	this.fileName = fileName;
	this.groups = [];
	this.section = null;

}

Svx3dHandler.prototype.constructor = Svx3dHandler;

Svx3dHandler.prototype.type = 'arraybuffer';

Svx3dHandler.prototype.parse = function ( cave, dataStream, metadata, section, progress ) {

	cave.metadata = metadata;

	this.section = section;
	this.progress = progress;
	this.groups = [];
	this.cave = cave;
	this.stationMap = new Map();
	this.dataStream = dataStream;

	let pos = 0; // file position
	const decoder = new TextDecoder();

	// read file header

	readLF(); // Survex 3D Image File
	this.version = readLF(); // 3d version
	const auxInfo = readNSLF();
	readLF(); // Date

	const sourceCRS = ( auxInfo[ 1 ] === undefined ) ? null : auxInfo[ 1 ]; // coordinate reference system ( proj4 format )

	console.log( 'Survex .3d version ', this.version );

	this.pos = pos;

	return cave.setCRS( sourceCRS ).then( () => this.parse2() );

	function readLF () { // read until Line feed

		return readNSLF()[ 0 ];

	}

	function readNSLF () { // read until Line feed and split by null bytes

		const bytes = new Uint8Array( dataStream, 0 );
		const strings = [];

		let b;
		let start = pos;

		do {

			b = bytes[ pos++ ];

			if ( b === 0x0a || b === 0 ) {

				strings.push( decoder.decode( bytes.subarray( start, pos ) ).trim() );
				start = pos;

			}

		} while ( b !== 0x0a );

		return strings;

	}

};

Svx3dHandler.prototype.parse2 = function () {

	const cave = this.cave;

	switch ( this.version ) {

	case 'Bv0.01':

		this.handleOld( 1 );

		break;

	case 'v3':
	case 'v4':
	case 'v5':
	case 'v6':
	case 'v7':
	case 'v8':

		this.handleVx( Number( this.version.charAt( 1 ) ), this.section );

		break;

	default:

		throw new Error( 'unsupported .3d version ' + this.version );

	}

	// if pre selecting a section - trim returned surveyTree
	if ( this.section !== null ) cave.surveyTree.trim( this.section.split( '.' ) );

	cave.addStations( this.stationMap );

	cave.addLineSegments( this.groups );

	return cave;

};

Svx3dHandler.prototype.handleOld = function ( version ) {

	const cave       = this.cave;
	const source     = this.dataStream;
	const surveyTree = cave.surveyTree;
	const projection = cave.projection;
	const limits     = cave.limits;

	const groups     = this.groups;
	const stationMap = this.stationMap;

	// init cmd handler table with error handler for unsupported records
	// or invalid records
	const cmd = Array( 256 ).fill( cmd_UNKNOWN );

	const stations = new Map();

	const dataView   = new DataView( source, 0 );
	const data       = new Uint8Array( source, 0 );
	const dataLength = data.length;

	let label     = '';
	const sectionId = 0;
	let legs      = [];
	let pos = this.pos;

	let lastPosition = new StationPosition(); // value to allow approach vector for xsect coord frame

	function cmd_UNKNOWN ( e ) { throw new Error( 'unhandled command: ' + e.toString( 16 ) + ' @ ' + pos.toString( 16 ) ); }

	cmd[ 0x00 ] = cmd_STOP;
	cmd[   -1 ] = cmd_STOP;

	cmd[ 0x01 ] = cmd_SKIP;

	cmd[ 0x02 ] = cmd_LABEL_V1; // version numbers not related to Survex versions
	cmd[ 0x03 ] = cmd_LABEL_V1;

	cmd[ 0x04 ] = cmd_MOVE;
	cmd[ 0x05 ] = cmd_LINE_V1;

	cmd[ 0x06 ] = cmd_LABEL_V2;
	cmd[ 0x07 ] = cmd_LABEL_V3;

	for ( let i = 0x40; i < 0x80; i++ ) {

		cmd[ i ] = cmd_LABEL_V4;

	}

	for ( let i = 0x80; i < 0x100; i++ ) {

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

	for ( let i = 0, li = groups.length; i < li; i++ ) {

		const group = groups[ i ];

		for ( let j = 0, lj = group.length; j < lj; j++ ) {

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

		let nextByte = data[ pos++ ];

		while ( nextByte !== 10 ) {

			db.push( nextByte );
			nextByte = data[ pos++ ];

		}

		if ( db[ 0 ] === 92 ) db.shift(); // remove initial '/' characters

		label = String.fromCharCode.apply( null, db );

		const node = surveyTree.addLeaf( label.split( '.' ), STATION_NORMAL, lastPosition );

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

		let coords = new StationPosition(
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

			if ( projection !== null) {

				const projectedCoords = projection.forward( {
					x: coords.x,
					y: coords.y
				} );

				coords.x = projectedCoords.x;
				coords.y = projectedCoords.y;

			}

			limits.expandByPoint( coords );

			stationMap.set( key, coords );

		}

		return coords;

	}

};

Svx3dHandler.prototype.handleVx = function ( version, section ) {

	const cave       = this.cave;
	const source     = this.dataStream;

	const surveyTree = cave.surveyTree;
	const messages   = cave.messages;
	const projection = cave.projection;
	const limits     = cave.limits;

	const groups     = this.groups;
	const xGroups    = [];
	const stationMap = this.stationMap;

	// init cmd handler table with error handler for unsupported records
	// or invalid records
	const cmd = Array( 256 ).fill( cmd_UNKNOWN );

	const stations = new Map();

	const data       = new Uint8Array( source, 0 );
	const dataView   = new DataView( source, 0 );
	const dataLength = data.length;
	const __coords = { x: 0.0, y: 0.0 };

	let pos = this.pos;
	let legs      = [];
	let label     = '';
	let xSects    = [];
	let sectionId = 0;

	let move = false;
	let lastPosition = new StationPosition();
	let lastKey = null; // map key for last coordinates read

	let lastXSectPosition = null; // value to indicate missing approach vector for xsect coord frame
	let labelChanged = false;
	let inSection = ( section === null );
	let splayExpected = false; // xsect expected to end on a splay

	let message;

	// functions

	let readLabel;

	function cmd_UNKNOWN ( e ) { throw new Error( 'unhandled command: ' + e.toString( 16 ) + ' @ ' + pos.toString( 16 ) ); }

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

		for ( let i = 0x40; i < 0x80; i++ ) {

			cmd[ i ] = cmd_LINE;

		}

		for ( let i = 0x80; i < 0x100; i++ ) {

			cmd[ i ] = cmd_LABEL;

		}

		// dispatch table end

		readLabel = readLabelV8;

		// skip v8 file wide flags after header
		pos++;

	} else {

		// dispatch table for v7 format

		for ( let i = 0x01; i < 0x0f; i++ ) {

			cmd[ i ] = cmd_TRIM_PLUS;

		}

		cmd[ 0x0f ] = cmd_MOVE;

		for ( let i = 0x10; i < 0x20; i++ ) {

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

		for ( let i = 0x40; i < 0x80; i++ ) {

			cmd[ i ] = cmd_LABEL;

		}

		for ( let i = 0x80; i < 0xc0; i++ ) {

			cmd[ i ] = cmd_LINE;

		}
		// dispatch table end

		readLabel = readLabelV7;

	}

	if ( version >= 4 && version <= 6 ) {

		cmd[ 0x20 ] = cmd_DATE_V4;
		cmd[ 0x21 ] = cmd_DATE2_V4;

	}

	// common record iterator
	// loop though data, handling record types as required.

	const batch = Math.round( dataLength / 10 );
	let c = 0;

	while ( pos < dataLength ) {

		if ( c++ == batch ) {

			c = 0;
			this.progress( Math.round( 25 * pos / dataLength ) + 75 );

		}

		if ( ! cmd[ data[ pos ] ]( data[ pos++ ] ) ) break;

	}

	// add last xSect group
	if ( xSects.length > 1 ) {

		xGroups.push( xSects );

	}

	const caveXgroups = cave.xGroups;

	xGroups.forEach( group => {
		if ( group.length > 1 ) caveXgroups.push( group );
	} );

	stationMap.forEach( coords => limits.expandByPoint( coords ) );

	groups.push( legs );

	return;

	function readLabelV7 () {
		// find length of label and read label = v3 - v7 .3d format

		let len = 0;

		switch ( data[ pos ] ) {

		case 0xfe:

			len = dataView.getUint16( pos, true ) + data[ pos ];
			pos += 2;

			break;

		case 0xff:

			len = dataView.getUint32( pos, true );
			pos += 4;

			break;

		default:

			len = data[ pos++ ];

		}

		if ( len === 0 ) return;

		label += String.fromCharCode.apply( null, data.subarray( pos, ( pos += len ) ) );

		labelChanged = true;

		if ( section !== null ) inSection = label.startsWith( section );

		return;

	}

	function readLabelV8 ( flags ) {

		if ( flags & 0x20 ) return false; // no label change

		let b = data[ pos++ ];
		let add = 0;
		let del = 0;

		if ( b !== 0 ) {

			// handle 4b= bit del/add codes
			del = b >> 4; // left most 4 bits
			add = b & 0x0f; // right most 4 bits

		} else {

			// handle 8 bit and 32 bit del/add codes
			b = data[ pos++ ];

			if ( b !== 0xff ) {

				del = b;

			} else {

				del = dataView.getUint32( pos, true );
				pos += 4;

			}

			b = data[ pos++ ];

			if ( b !== 0xff ) {

				add = b;

			} else {

				add = dataView.getUint32( pos, true );
				pos += 4;

			}

		}

		if ( add === 0 && del === 0 ) return;

		if ( del ) label = label.slice( 0, -del );

		if ( add ) {

			label += String.fromCharCode.apply( null, data.subarray( pos, ( pos += add ) ) );

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

		if ( label.charAt( label.length - 1 ) === '.' ) label = label.slice( 0, -1 ); // strip trailing '.'

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
			// add it to the survey tree

			sectionId = surveyTree.addPath( label ).id;
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

			if ( ( flags & 0x07 ) === 0 ) {

				// reference count underground legs ignoring splay and surface legs
				// used for topology reconstruction

				lastPosition.connections++;
				thisPosition.connections++;

				legs.push( { coords: thisPosition, type: LEG_CAVE, survey: sectionId } );

			} else if ( flags & 0x04 ) {

				lastPosition.splays++;
				legs.push( { coords: thisPosition, type: LEG_SPLAY, survey: sectionId } );

				thisPosition.splays = -1;

			} else if ( flags & 0x01 ) {

				legs.push( { coords: thisPosition, type: LEG_SURFACE, survey: sectionId } );

			} else if ( flags & 0x02 ) {

				legs.push( { coords: thisPosition, type: LEG_DUPLICATE, survey: sectionId } );

			}

			lastPosition = thisPosition;

		} else {

			if ( move ) {

				// correct marking of last position moved to.
				dropLastCoordinates();
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

		if ( ! inSection && move ) dropLastCoordinates();

		lastPosition = readCoordinates();

		move = true;

		return true;

	}

	function cmd_ERROR ( /* c */ ) {

		/*

		const l = new DataView( source, pos );

		const legs = l.getInt32( 0, true );
		const length = l.getInt32( 4, true );

		const E = l.getInt32( 8, true );
		const H = l.getInt32( 12, true );
		const V = l.getInt32( 16, true );

		*/

		pos += 20;

		return true;

	}

	function cmd_LABEL ( c ) {

		const flags = c & 0x7f;
		/*
		0x01	Station is on leg above ground
		0x02	Station is on an underground leg (both may be true at an entrance)
		0x04	Station is marked as an entrance (with *entrance)
		0x08	Station is exported (i.e. may be used as a connection point to other surveys)
		0x10	Station is a fixed point (control point)
		0x20	Station is anonymous
		0x40	Station is on the passage wall
		*/

		readLabel( 0 );
		if ( ( ! ( flags & 0x0E ) || flags & 0x20 ) || ! inSection ) { // skip surface only stations

			pos += 12; //skip coordinates
			return true;

		}

		const coords = readCoordinates();
		const path = label.split( '.' );

		stations.set(
			label,
			surveyTree.addLeaf( path, ( ( flags & 0x04 ) ? STATION_ENTRANCE : STATION_NORMAL ), coords )
		);

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
				r: l.getInt32( 4, true ) / 100,
				u: l.getInt32( 8, true ) / 100,
				d: l.getInt32( 12, true ) / 100
			}
		);

	}

	function commonXSECT ( flags, lrud ) {

		if ( section !== null && ! label.startsWith( section ) ) return true;

		const node = stations.get( label );

		if ( ! node ) return true;

		const surveyId = node.parent.id;

		xSects.push( { start: lastXSectPosition, end: node, lrud: lrud, survey: surveyId, type: WALL_SQUARE } );

		// record which stations have associated LRUD coords
		node.type = node.type | STATION_XSECT;

		// some XSECTS are not flagged as last in passage
		// if a station has only one connection and is not the first in a set of XSECTS
		// it is at the end of a run of legs. Add a break to remove flyback artifacts

		let endRun = false;

		if ( flags ) {

			endRun = true;

		} else if ( node.connections === 1 && xSects.length > 1 && ! ( lastPosition.connections === 0 ) ) {

			message = {
				station: node,
				text: 'LRUD fault'
			};

			if ( node.splays === 0 ) {

				endRun = true;
				messages.push( message );

			} else {

				// expecting next is a splay
				splayExpected = true;

			}

		} else if ( splayExpected && node.connections !== 0 ) {

			messages.push( message );

			splayExpected = false;

		}

		if ( endRun ) {

			if ( xSects.length > 0 ) xGroups.push( xSects );

			lastXSectPosition = null;
			xSects = [];
			splayExpected = false;

		} else {

			lastXSectPosition = node;

		}

		return true;

	}

	function readCoordinates () {

		const l = new DataView( source, pos );

		lastKey = String.fromCharCode.apply( null, data.subarray( pos, pos + 12 ) );

		let coords = new StationPosition(
			l.getInt32( 0, true ) / 100,
			l.getInt32( 4, true ) / 100,
			l.getInt32( 8, true ) / 100
		);

		pos += 12;

		const cachedCoords = stationMap.get( lastKey );

		if ( cachedCoords !== undefined ) {

			coords = cachedCoords;

		} else {

			if ( projection !== null ) {

				__coords.x = coords.x;
				__coords.y = coords.y;

				const projectedCoords = projection.forward( __coords );

				coords.x = projectedCoords.x;
				coords.y = projectedCoords.y;

			}

			stationMap.set( lastKey, coords );

		}

		return coords;

	}

	function dropLastCoordinates () {

		// don't drop coordinates we know are in the section being extracted
		if ( lastPosition.connections ) return;

		stationMap.delete( lastKey );

	}

};

Svx3dHandler.prototype.getLineSegments = function () {

	const lineSegments = [];
	const groups = this.groups;

	for ( let i = 0, l = groups.length; i < l; i++ ) {

		const g = groups[ i ];

		for ( let v = 0, vMax = g.length - 1; v < vMax; v++ ) {

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

export { Svx3dHandler };