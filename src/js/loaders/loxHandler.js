
import { LEG_CAVE, LEG_SPLAY, LEG_SURFACE, STATION_ENTRANCE, STATION_NORMAL } from '../core/constants';
import { Tree } from '../core/Tree';
import { Vector3, Box3 } from '../Three';

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

loxHandler.prototype.parse = function( dataStream, metadata, section ) {

	this.metadata     = metadata;

	const lineSegments = [];
	const stations     = [];
	const self         = this;
	const surveyTree   = this.surveyTree;
	const xSects       = [];

	// assumes little endian data ATM - FIXME

	var source = dataStream;
	const l = source.byteLength;

	var pos = 0; // file position
	var dataStart;
	var f = new DataView( source, 0 );

	var sectionId = 0;
	var lastParentId;
	var parentNode;

	// range

	const limits = new Box3();

	while ( pos < l ) readChunkHdr();

	this.lineSegments = lineSegments;

	// Drop data to give GC a chance ASAP
	source = null;

	const offsets = limits.getCenter();

	this.limits = limits;
	this.offsets = offsets;

	// convert to origin centered coordinates

	var i, j;

	for ( i = 0; i < stations.length; i++ ) {

		stations[ i ].sub( offsets );

	}

	const scraps = this.scraps;

	// covert scraps coordinates

	for ( i = 0; i < scraps.length; i++ ) {

		const vertices = scraps[ i ].vertices;

		for ( j = 0; j < vertices.length; j++ ) {

			vertices[ j ].sub( offsets );

		}

	}

	procXsects();

	return this;

	// .lox parsing functions

	function readChunkHdr () {

		const m_type     = readUint();
		const m_recSize  = readUint();
		const m_recCount = readUint();
		const m_dataSize = readUint();

		var doFunction;

		// offset of data region for out of line strings/images/scrap data.
		dataStart = pos + m_recSize;

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

		pos += m_dataSize;

	}

	function procXsects () {

		const xGroups = self.xGroups;
		const ends = [];

		var lastTo, xGroup, i;

		xSects.sort( function ( a, b ) { return a.m_from - b.m_from; } );

		for ( i = 0; i < xSects.length; i++ ) {

			const xSect = xSects[ i ];

			if ( xSect.m_from !== lastTo ) {

				xGroup = [];
				self.xGroups.push( xGroup );

			}

			lastTo = xSect.m_to;

			xGroup.push( xSect );

		}

		for ( i = 0; i < xGroups.length; i++ ) {

			const group = xGroups[ i ];

			const start = group[ 0 ].m_from;
			const end = group[ group.length - 1 ].m_to;

			// concatenate adjacent groups

			const prepend = ends.indexOf( start );

			if ( prepend !== -1 ) {

				// keep the new run in the same slot - thus end record remains correct
				xGroups[ i ] = xGroups[ prepend ].concat( group );

				// remove entry from moved group
				xGroups[ prepend ] = [];
				ends[ prepend ] = undefined;

			}

			ends.push( end );

		}

		for ( i = 0; i < xGroups.length; i++ ) {

			const group = xGroups[ i ];
			const xSect = group[ 0 ];

			if ( xSect === undefined ) continue; // groups that have been merged

			const start = xSect.start;
			const end = xSect.end;

			// fake approach vector for initial xSect ( mirrors first segment vector )

			const newStart = new Vector3().copy( start ).multiplyScalar( 2 ).sub( end );

			group.unshift( { start: newStart, end: start, lrud: xSect.fromLRUD, survey: xSect.survey, type: xSect.type } );

		}

	}

	function readUint () {

		const i = f.getUint32( pos, true );

		pos += 4;

		return i;

	}

	function readFloat64 () {

		const i = f.getFloat64( pos, true );

		pos += 8;

		return i;

	}

	function readSurvey () {

		const m_id     = readUint();
		const namePtr  = readDataPtr();
		const m_parent = readUint();
		const titlePtr = readDataPtr();

		if ( lastParentId !== m_parent ) {

			parentNode = surveyTree.findById( m_parent );
			lastParentId = m_parent;

		}

		if ( m_parent != m_id ) {

			let node = surveyTree.addById( readString( namePtr ), m_id, parentNode );

			if ( node === null ) console.warn( 'error constructing survey tree for', readString( titlePtr ) );

			if ( section !== null && node.getPath() === section ) {

				sectionId = m_id;

			}

		}

	}

	function readDataPtr () {

		const m_position = readUint();
		const m_size     = readUint();

		return { position: m_position, size: m_size };

	}

	function readString ( ptr ) {

		// strings are null terminated. Ignore last byte in string
		const bytes = new Uint8Array( source, dataStart + ptr.position, ptr.size - 1 );

		return String.fromCharCode.apply( null, bytes );

	}

	function readStation () {

		const m_id       = readUint();
		const m_surveyId = readUint();
		const namePtr    = readDataPtr();

		pos += 8; // readDataPtr(); // commentPtr - ignored

		const m_flags    = readUint();
		const coords     = readCoords();

		stations[ m_id ] = coords;

		// add stations to surveyTree make station id negative to avoid clashes with survey id space.

		// m_flags & 0x01 = surface

		if ( lastParentId !== m_surveyId ) {

			parentNode = surveyTree.findById( m_surveyId );
			lastParentId = m_surveyId;

		}

		surveyTree.addById( readString( namePtr ), - m_id, parentNode, { p: coords, type: ( m_flags & 0x02 ) ? STATION_ENTRANCE : STATION_NORMAL } );

	}

	function readCoords () {

		const coords = new Vector3(
			readFloat64(),
			readFloat64(),
			readFloat64()
		);

		limits.expandByPoint( coords );

		return coords;

	}

	function readShot () {

		const m_from_r  = readUint();
		const m_to_r    = readUint();

		var m_from, m_to, fromLRUD, toLRUD;

		if ( m_to_r > m_from_r ) {

			m_from = m_from_r;
			m_to = m_to_r;
			fromLRUD = readLRUD( true );
			toLRUD   = readLRUD( true );

		} else {

			m_from = m_to_r;
			m_to = m_from_r;
			toLRUD   = readLRUD( false );
			fromLRUD = readLRUD( false );

		}

		const m_flags       = readUint();
		const m_sectionType = readUint();
		const m_surveyId    = readUint();

		pos += 8; // readFloat64(); // m_threshold

		if ( sectionId !== 0 && m_surveyId !== sectionId ) return;

		var type = LEG_CAVE;

		if ( m_flags & 0x01 ) type = LEG_SURFACE;
		if ( m_flags & 0x08 ) type = LEG_SPLAY;

		const from = stations[ m_from ];
		const to   = stations[ m_to ];

		/*
		.lox section types

		LXFILE_SHOT_SECTION_NONE 0
		LXFILE_SHOT_SECTION_OVAL 1
		LXFILE_SHOT_SECTION_SQUARE 2
		LXFILE_SHOT_SECTION_DIAMOND 3
		LXFILE_SHOT_SECTION_TUNNEL 4
		*/

		if ( m_sectionType !== 0x00 && type === LEG_CAVE ) {

			xSects.push( { m_from: m_from, m_to: m_to, start: from, end: to, fromLRUD: fromLRUD, lrud: toLRUD, survey: m_surveyId, type: m_sectionType } );

		}

		if ( from.equals( to ) ) {
			// console.log( 'dup leg ', surveyTree.findById( -m_from ).getPath() );
			// console.log( '        ', surveyTree.findById( -m_to ).getPath() );
			return;
		}

		lineSegments.push( { from: from, to: to, type: type, survey: m_surveyId } );

	}

	function readLRUD ( forward ) {

		if ( forward ) {

			return {
				l: readFloat64(),
				r: readFloat64(),
				u: readFloat64(),
				d: readFloat64()
			};

		} else {

			return {
				r: readFloat64(),
				l: readFloat64(),
				u: readFloat64(),
				d: readFloat64()
			};

		}

	}

	function readScrap () {

		readUint(); // m_id

		const m_surveyId   = readUint();

		const m_numPoints  = readUint();
		const pointsPtr    = readDataPtr();

		const m_num3Angles = readUint();
		const facesPtr     = readDataPtr();

		const scrap = { vertices: [], faces: [], survey: m_surveyId };

		var lastFace;
		var i, j;

		if ( sectionId !== 0 && m_surveyId !== sectionId ) return;

		for ( i = 0; i < m_numPoints; i++ ) {

			const offset = dataStart + pointsPtr.position + i * 24; // 24 = 3 * sizeof( double )
			const f = new DataView( source, offset );

			scrap.vertices.push( new Vector3(
				f.getFloat64( 0,  true ),
				f.getFloat64( 8,  true ),
				f.getFloat64( 16, true )
			) );

		}

		// read faces from out of line data area

		for ( i = 0; i < m_num3Angles; i++ ) {

			const offset = dataStart + facesPtr.position + i * 12; // 12 = 3 * sizeof( uint32 )
			const f = new DataView( source, offset );

			const face = [
				f.getUint32( 0, true ),
				f.getUint32( 4, true ),
				f.getUint32( 8, true )
			];

			// check for face winding order == orientation

			fix_direction: { if ( lastFace !== undefined ) {

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

		const m_width    = readUint();
		const m_height   = readUint();

		const surfacePtr = readDataPtr();
		const m_calib    = readCalibration();

		const ab = source.slice( pos, pos + surfacePtr.size ); // required for 64b alignment

		const dtm = new Float64Array( ab, 0 );

		// flip y direction

		const data = [];

		var i, j;

		for ( i = 0; i < m_height; i++ ) {

			const offset = ( m_height - 1 - i ) * m_width;

			for ( j = 0; j < m_width; j++ ) {

				data.push( dtm[ offset + j ] );

			}

		}

		self.terrain.dtm = {
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

		const m_calib = [];

		m_calib[ 0 ] = readFloat64(  ); // x origin
		m_calib[ 1 ] = readFloat64( 8,  true ); // y origin
		m_calib[ 2 ] = readFloat64( 16, true ); // xx ( 2 x 2 ) rotate and scale matrix
		m_calib[ 3 ] = readFloat64( 24, true ); // xy "
		m_calib[ 4 ] = readFloat64( 32, true ); // yx "
		m_calib[ 5 ] = readFloat64( 40, true ); // yy "

		return m_calib;

	}

	function readSurfaceBMP () {

		readUint(); // m_type
		readUint(); // m_surfaceId

		const imagePtr = readDataPtr();
		const m_calib = readCalibration();

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

		const imgData = new Uint8Array( source, dataStart + imagePtr.position, imagePtr.size );

		const b1 = imgData[ 0 ];
		const b2 = imgData[ 1 ];

		var type;

		if ( b1 === 0xff && b2 === 0xd8 ) {

			type = 'image/jpeg';

		} else if ( b1 === 0x89 && b2 === 0x50 ) {

			type = 'image/png';

		}

		if ( ! type ) return '';

		const blob = new Blob( [ imgData ], { type: type } );
		const blobURL = URL.createObjectURL( blob );

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