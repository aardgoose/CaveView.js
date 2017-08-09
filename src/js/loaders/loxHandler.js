
import { LEG_CAVE, LEG_SPLAY, LEG_SURFACE, STATION_ENTRANCE, STATION_NORMAL } from '../core/constants';
import { Tree } from '../core/Tree';

function loxHandler  ( fileName ) {

	this.fileName     = fileName;
	this.scraps       = [];
	this.faults       = [];
	this.lineSegments = [];
	this.xGroups      = [];
	this.surveyTree   = new Tree( '', 0 );
	this.terrain      = {};
	this.hasTerrain   = false;

}

loxHandler.prototype.constructor = loxHandler;

loxHandler.prototype.type = 'arraybuffer';
loxHandler.prototype.isRegion = 'false';

loxHandler.prototype.parse = function( dataStream, metadata ) {

	this.metadata     = metadata;

	var lineSegments = [];
	var stations     = [];
	var self         = this;
	var surveyTree   = this.surveyTree;

	// assumes little endian data ATM - FIXME

	var source = dataStream;
	var pos = 0; // file position
	var dataStart;
	var f = new DataView( source, 0 );
	var l = source.byteLength;

	var xGroup = [];
	var lastTo;

	// range

	var min = { x: Infinity, y: Infinity, z: Infinity };
	var max = { x: -Infinity, y: -Infinity, z: -Infinity };

	while ( pos < l ) readChunkHdr();

	this.lineSegments = lineSegments;

	// Drop data to give GC a chance ASAP
	source = null;

	this.limits = {
		min: min,
		max: max
	};

	var offsets = {
		x: ( min.x + max.x ) / 2,
		y: ( min.y + max.y ) / 2,
		z: ( min.z + max.z ) / 2
	};

	this.offsets = offsets;

	// convert to origin centered coordinates

	var i, j, coords, vertices;

	for ( i = 0; i < stations.length; i++ ) {

		coords = stations[ i ];

		coords.x -= offsets.x;
		coords.y -= offsets.y;
		coords.z -= offsets.z;

	}

	var scraps = this.scraps;

	// covert scraps coordinates

	for ( i = 0; i < scraps.length; i++ ) {

		vertices = scraps[ i ].vertices;

		for ( j = 0; j < vertices.length; j++ ) {

			coords = vertices[ j ];

			coords.x -= offsets.x;
			coords.y -= offsets.y;
			coords.z -= offsets.z;

		}

	}

	return this;

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

			console.warn( 'unknown chunk header. type : ', m_type );

		}

		if ( doFunction !== undefined ) {

			for ( var i = 0; i < m_recCount; i++ ) {

				doFunction();

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

	function readSurvey () {

		var m_id     = readUint();
		var namePtr  = readDataPtr();
		var m_parent = readUint();
		var titlePtr = readDataPtr();

		if ( m_parent != m_id ) {

			if ( ! surveyTree.addById( readString( namePtr ), m_id, m_parent ) ) console.warn( 'error constructing survey tree for', readString( titlePtr ) );

		}

	}

	function readDataPtr () {

		var m_position = readUint();
		var m_size     = readUint();

		return { position: m_position, size: m_size };

	}

	function readString ( ptr ) {

		// strings are null terminated. Igore last byte in string
		var bytes = new Uint8Array( source, dataStart + ptr.position, ptr.size - 1 );

		return String.fromCharCode.apply( null, bytes );

	}

	function readStation () {

		var m_id       = readUint();
		var m_surveyId = readUint();
		var namePtr    = readDataPtr();

		readDataPtr(); // commentPtr

		var m_flags    = readUint();
		var coords     = readCoords();

		stations[ m_id ] = coords;

		// add stations to surveyTree make station id negative to avoid clashes with survey id space.

		// m_flags & 0x01 = surface

		surveyTree.addById( readString( namePtr ), - m_id, m_surveyId, { p: coords, type: ( m_flags & 0x02 ) ? STATION_ENTRANCE : STATION_NORMAL } );

	}

	function readCoords () {

		var f = new DataView( source, pos );

		pos += 24;

		coords = {
			x: f.getFloat64( 0,  true ),
			y: f.getFloat64( 8,  true ),
			z: f.getFloat64( 16, true )
		};

		min.x = Math.min( coords.x, min.x );
		min.y = Math.min( coords.y, min.y );
		min.z = Math.min( coords.z, min.z );

		max.x = Math.max( coords.x, max.x );
		max.y = Math.max( coords.y, max.y );
		max.z = Math.max( coords.z, max.z );

		return coords;

	}

	function readShot () {

		var m_from = readUint();
		var m_to   = readUint();

		var fromLRUD = readLRUD();
		var toLRUD   = readLRUD();

		var m_flags = readUint();

		var m_sectionType = readUint();

		var m_surveyId = readUint();

		f.getFloat64( pos, true ); // m_threshold

		var type = LEG_CAVE;

		pos += 8;

		if ( m_flags & 0x01 ) type = LEG_SURFACE;
		if ( m_flags & 0x08 ) type = LEG_SPLAY;

		var from = stations[ m_from ];
		var to   = stations[ m_to ];

		if ( m_sectionType !== 0x00 ) {

			if ( m_from !== lastTo ) {

				// new set of shots

				xGroup = [];
				self.xGroups.push( xGroup );

				xGroup.push( { start: to, end: from, lrud: fromLRUD, survey: m_surveyId } );

			}

			xGroup.push( { start: from, end: to, lrud: toLRUD, survey: m_surveyId } );

		}

		if ( from.x === to.x && from.y === to.y && from.z === to.z ) return;

		lineSegments.push( { from: from, to: to, type: type, survey: m_surveyId } );

		lastTo = m_to;

	}

	function readLRUD () {

		var f = new DataView( source, pos );

		pos += 32;

		return {
			l: f.getFloat64( 0,  true ),
			r: f.getFloat64( 8,  true ),
			u: f.getFloat64( 16, true ),
			d: f.getFloat64( 24, true )
		};

	}

	function readScrap () {

		readUint(); // m_id

		var m_surveyId   = readUint();

		var m_numPoints  = readUint();
		var pointsPtr    = readDataPtr();

		var m_num3Angles = readUint();
		var facesPtr     = readDataPtr();

		var scrap = { vertices: [], faces: [], survey: m_surveyId };
		var lastFace;
		var i, offset, f;

		for ( i = 0; i < m_numPoints; i++ ) {

			offset = dataStart + pointsPtr.position + i * 24; // 24 = 3 * sizeof( double )
			f = new DataView( source, offset );

			scrap.vertices.push( {
				x: f.getFloat64( 0,  true ),
				y: f.getFloat64( 8,  true ),
				z: f.getFloat64( 16, true )
			} );

		}

		// read faces from out of line data area

		for ( i = 0; i < m_num3Angles; i++ ) {

			offset = dataStart + facesPtr.position + i * 12; // 12 = 3 * sizeof( uint32 )
			f = new DataView( source, offset );

			var face = [
				f.getUint32( 0, true ),
				f.getUint32( 4, true ),
				f.getUint32( 8, true )
			];

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

		readUint(); // m_id

		var m_width    = readUint();
		var m_height   = readUint();

		var surfacePtr = readDataPtr();
		var m_calib    = readCalibration();

		var ab = source.slice( pos, pos + surfacePtr.size ); // required for 64b alignment

		var dtm = new Float64Array( ab, 0 );

		// flip y direction

		var data = [];

		for ( var i = 0; i < m_height; i++ ) {

			var offset = ( m_height - 1 - i ) * m_width;

			for ( var j = 0; j < m_width; j++ ) {

				data.push( dtm[ offset + j ] );

			}

		}

		var terrain = self.terrain;

		terrain.dtm = {
			data: data,
			samples: m_width,
			lines:   m_height,
			xOrigin: m_calib[ 0 ],
			yOrigin: m_calib[ 1 ],
			xx:      m_calib[ 2 ],
			xy:      m_calib[ 3 ],
			yx:      m_calib[ 4 ],
			yy:      m_calib[ 5 ]
		};

		self.hasTerrain = true;

	}

	function readCalibration () {

		var f = new DataView( source, pos );
		var m_calib = [];

		m_calib[ 0 ] = f.getFloat64( 0,  true ); // x origin
		m_calib[ 1 ] = f.getFloat64( 8,  true ); // y origin
		m_calib[ 2 ] = f.getFloat64( 16, true ); // xx ( 2 x 2 ) rotate and scale matrix
		m_calib[ 3 ] = f.getFloat64( 24, true ); // xy "
		m_calib[ 4 ] = f.getFloat64( 32, true ); // yx "
		m_calib[ 5 ] = f.getFloat64( 40, true ); // yy "

		pos += 48;

		return m_calib;

	}

	function readSurfaceBMP () {

		readUint(); // m_type
		readUint(); // m_surfaceId

		var imagePtr = readDataPtr();

		var m_calib = readCalibration();

		self.terrain.bitmap = {
			image:   extractImage( imagePtr ),
			xOrigin: m_calib[ 0 ],
			yOrigin: m_calib[ 1 ],
			xx:      m_calib[ 2 ],
			xy:      m_calib[ 3 ],
			yx:      m_calib[ 4 ],
			yy:      m_calib[ 5 ]
		};

	}

	function extractImage ( imagePtr ) {

		var imgData = new Uint8Array( source, dataStart + imagePtr.position, imagePtr.size );
		var type;

		var b1 = imgData[ 0 ];
		var b2 = imgData[ 1 ];

		if ( b1 === 0xff && b2 === 0xd8 ) {

			type = 'image/jpeg';

		} else if ( b1 === 0x89 && b2 === 0x50 ) {

			type = 'image/png';

		}

		if ( ! type ) return '';

		var blob = new Blob( [ imgData ], { type: type } );
		var blobURL = URL.createObjectURL( blob );

		return blobURL;

	}

};

loxHandler.prototype.getSurvey = function () {

	return {
		title: this.fileName,
		surveyTree: this.surveyTree,
		sourceCRS: null,
		targetCRS: null,
		lineSegments: this.lineSegments,
		crossSections: this.xGroups,
		scraps: this.scraps,
		hasTerrain: this.hasTerrain,
		metadata: this.metadata,
		terrain: this.terrain,
		limits: this.limits,
		offsets: this.offsets
	};

};

export { loxHandler };

// EOF