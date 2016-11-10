
import { NORMAL, SPLAY, SURFACE } from '../core/constants.js';
import { Tree } from '../core/Tree.js';

function loxHandler  ( fileName, dataStream ) {

	this.fileName          = fileName;
	this.entrances         = [];
	this.terrain           = [];
	this.terrainBitmap     = "";
	this.terrainDimensions = {};
	this.scraps            = [];
	this.faults            = [];
	this.lineSegments      = [];
	this.sections          = new Map();
	this.surveyTree        = new Tree( "", 0 );
	this.isRegion		   = false;

	var lineSegments = [];
	var xSects       = [];
	var stations     = [];
	var lines        = 0;
	var samples      = 0;
	var self         = this;
	var surveyTree   = this.surveyTree;

	// assumes little endian data ATM - FIXME

	var source = dataStream;
	var pos = 0; // file position
	var dataStart;
	var f = new DataView( source, 0 );
	var l = source.byteLength;

	while ( pos < l ) readChunkHdr();

	this.lineSegments = lineSegments;

	// Drop data to give GC a chance ASAP
	source = null;

	// strip empty/single top nodes of tree
	this.surveyTree = surveyTree.reduce( "unknown" );

	return;

	// .lox parsing functions

	function readChunkHdr () {

		var m_type     = readUint();
		var m_recSize  = readUint();
		var m_recCount = readUint();
		var m_dataSize = readUint();
		var doFunction;

		// offset of data region for out of line strings/images/scrap data.
		dataStart  = pos + m_recSize;

		switch ( m_type ) {

		case 1:

			doFunction = readSurvey;

			break;

		case 2:

			doFunction = readStation;

			break;

		case 3:

			doFunction = readShot;

			break;

		case 4:

			doFunction = readScrap;

			break;

		case 5:

			doFunction = readSurface;

			break;

		case 6:

			doFunction = readSurfaceBMP;

			break;

		default:

			console.log( "unknown chunk header. type : ", m_type );

		}

		if ( doFunction !== undefined) {

			for ( var i = 0; i < m_recCount; i++ ) {

				doFunction( i );

			}

		}

		skipData( m_dataSize );
	}

	function readUint () {

		var i = f.getUint32( pos, true );

		pos += 4;

		return i;

	}

	function skipData ( i ) {

		pos += i;

	}

	function readSurvey ( i ) {

		var m_id     = readUint();
		var namePtr  = readDataPtr();
		var m_parent = readUint();
		var titlePtr = readDataPtr();

		if ( m_parent != m_id ) {

			if ( !surveyTree.addById( readString( namePtr ), m_id, m_parent ) ) console.log( "error constructing survey tree" );

		}

	}

	function readDataPtr() {

		var m_position = readUint();
		var m_size     = readUint();

		return { position: m_position, size: m_size };

	}

	function readString ( ptr ) {

		var bytes = new Uint8Array( source, dataStart + ptr.position, ptr.size );

		return String.fromCharCode.apply( null, bytes );

	}

	function readStation () {

		var m_id       = readUint();
		var m_surveyId = readUint();
		var namePtr    = readDataPtr();

		readDataPtr(); // commentPtr

		var m_flags    = readUint();
		var coords     = readCoords();

		stations[ m_id ]  = coords;

		// add non surface stations to surveyTree

		if ( ! ( m_flags & 0x01 ) ) surveyTree.addById( readString( namePtr ),  m_id, m_surveyId, { p: coords } );

		if ( m_flags & 0x02 ) {

			// entrance
			self.entrances.push( { position: coords, label: readString(namePtr), survey: m_surveyId } );

		}

	}

	function readCoords () {

		var f = new DataView( source, pos );
		var coords = {};

		coords.x = f.getFloat64( 0,  true );
		coords.y = f.getFloat64( 8,  true );
		coords.z = f.getFloat64( 16, true );
		pos += 24;

		return coords;

	}

	function readShot () {

		var m_from = readUint();
		var m_to   = readUint();

		var fromLRUD = readLRUD();
		var toLRUD   = readLRUD();

		var m_flags       = readUint();
		var m_sectionType = readUint();
		var m_surveyId    = readUint();
		var m_threshold   = f.getFloat64( pos, true );
		var type          = NORMAL;

		pos += 8;


		if ( m_flags && 0x01 ) type = SURFACE;
		if ( m_flags && 0x08 ) type = SPLAY;

		if ( m_flags === 0x16 ) {

			xSects[ m_from ] = fromLRUD;
			xSects[ m_to ]   = toLRUD;

		}

		lineSegments.push( { from: stations[ m_from ], to: stations[ m_to ], type: type, survey: m_surveyId } );

	}

	function readLRUD () {

		var f = new DataView( source, pos );
		var L = f.getFloat64( 0,  true );
		var R = f.getFloat64( 8,  true );
		var U = f.getFloat64( 16, true );
		var D = f.getFloat64( 24, true );

		pos += 32;

		return { l: L, r: R, u: U, d: D };

	}

	function readScrap () {

		var m_id         = readUint();
		var m_surveyId   = readUint();

		var m_numPoints  = readUint();
		var pointsPtr    = readDataPtr();

		var m_num3Angles = readUint();
		var facesPtr     = readDataPtr();

		var scrap = { vertices: [], faces: [], survey: m_surveyId };
		var lastFace;
		var i;

		for ( i = 0; i < m_numPoints; i++ ) {

			var offset = dataStart + pointsPtr.position + i * 24; // 24 = 3 * sizeof(double)
			var f = new DataView( source, offset );
			var vertex = {};

			vertex.x = f.getFloat64( 0,  true );
			vertex.y = f.getFloat64( 8,  true );
			vertex.z = f.getFloat64( 16, true );

			scrap.vertices.push( vertex );

		}

		// read faces from out of line data area

		for ( i = 0; i < m_num3Angles; i++ ) {

			var offset = dataStart + facesPtr.position + i * 12; // 12 = 3 * sizeof(uint32)
			var f = new DataView( source, offset );
			var face = [];

			face[ 0 ] = f.getUint32( 0, true );
			face[ 1 ] = f.getUint32( 4, true );
			face[ 2 ] = f.getUint32( 8, true );

			// check for face winding order == orientation

			fix_direction: { if ( lastFace !== undefined ) {

				var j;

				for ( j = 0; j < 3; j++ ) { // this case triggers more often than those below.

					if ( face[ j ] == lastFace[ ( j + 2 ) % 3 ] && face[ ( j + 1 ) % 3 ] == lastFace[ ( j + 3 ) % 3 ] ) {

						face.reverse();
						break fix_direction;

					}

				}

				for ( j = 0; j < 3; j++ ) {

					if ( face[ j ] == lastFace[ j ] && face[ ( j + 1 ) % 3 ] == lastFace[ ( j + 1 ) % 3 ] ) {

						face.reverse();
						break fix_direction;

					}

				}

				for ( j = 0; j < 3; j++ ) {

					if ( face[ j ] == lastFace[ ( j + 1 ) % 3 ] && face[ ( j + 1 ) % 3 ] == lastFace[ ( j + 2 ) % 3 ] ) {

						face.reverse();
						break fix_direction;

					}

				}
			} }

			scrap.faces.push( face );
			lastFace = face;
		}

		self.scraps.push( scrap );

	}

	function readSurface () {

		var m_id       = readUint();
		var m_width    = readUint();
		var m_height   = readUint();

		var surfacePtr = readDataPtr(); 
		var m_calib    = readCalibration();

		var ab = source.slice( pos, pos + surfacePtr.size ); // required for 64b alignment

		self.terrain = new Float64Array( ab, 0 );

		self.terrainDimensions.samples = m_width;
		self.terrainDimensions.lines   = m_height;
		self.terrainDimensions.xOrigin = m_calib[ 0 ];
		self.terrainDimensions.yOrigin = m_calib[ 1 ];
		self.terrainDimensions.xDelta  = m_calib[ 2 ];
		self.terrainDimensions.yDelta  = m_calib[ 5 ];

	}

	function readCalibration () {

		var f = new DataView( source, pos );
		var m_calib = [];

		m_calib[ 0 ] = f.getFloat64( 0,  true );
		m_calib[ 1 ] = f.getFloat64( 8,  true );
		m_calib[ 2 ] = f.getFloat64( 16, true );
		m_calib[ 3 ] = f.getFloat64( 24, true );
		m_calib[ 4 ] = f.getFloat64( 32, true );
		m_calib[ 5 ] = f.getFloat64( 40, true );

		pos += 48;

		return m_calib;

	}

	function readSurfaceBMP () {

		var m_type      = readUint();
		var m_surfaceId = readUint();

		var imagePtr = readDataPtr();
		var m_calib  = readCalibration();

		self.terrainBitmap = extractImage( imagePtr );
	}

	function extractImage ( imagePtr ) {

		var imgData = new Uint8Array( source, dataStart + imagePtr.position, imagePtr.size );
		var type;

		var b1 = imgData[ 0 ];
		var b2 = imgData[ 1 ];

		if ( b1 === 0xff && b2 === 0xd8 ) {

			type = "image/jpeg";

		} else if ( b1 === 0x89 && b2 === 0x50 ) {

			type = "image/png";

		}

		if ( !type ) {

			return "";

		}

		var blob = new Blob( [ imgData ], { type: type } );
		var blobURL = URL.createObjectURL( blob );

		return blobURL;

	}
}

loxHandler.prototype.constructor = loxHandler;

loxHandler.prototype.getTerrainDimensions = function () {

	return this.terrainDimensions;

}

loxHandler.prototype.getTerrainData = function () {

	// flip y direction 
	var flippedTerrain = [];
	var lines   = this.terrainDimensions.lines;
	var samples = this.terrainDimensions.samples;

	for ( var i = 0; i < lines; i++ ) {

		var offset = ( lines - 1 - i ) * samples;

		for ( var j = 0; j < samples; j++ ) {

			flippedTerrain.push( this.terrain[ offset + j ] );

		}

	}

	return flippedTerrain;

}

loxHandler.prototype.getTerrainBitmap = function () {

	return this.terrainBitmap;

}

loxHandler.prototype.getSurvey = function () {

	return {
		title: this.fileName,
		surveyTree: this.surveyTree,
		lineSegments: this.lineSegments,
		crossSections: [],
		scraps: this.scraps,
		entrances: this.entrances,
		hasTerrain: false
	}

}

export { loxHandler };

// EOF