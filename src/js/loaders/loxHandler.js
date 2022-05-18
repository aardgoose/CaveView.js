import {
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE, LEG_DUPLICATE,
	STATION_ENTRANCE, STATION_NORMAL, STATION_XSECT
} from '../core/constants';
import { Vector3 } from '../Three';
import { StationPosition } from '../core/StationPosition';

class loxHandler {

	static modelOffset = 0;

	type = 'arraybuffer';

	constructor ( fileName ) {

		this.fileName = fileName;
	}

	parse ( cave, source, metadata, section, progress ) {

		// assumes little endian data ATM - FIXME

		loxHandler.modelOffset += 100000;

		cave.metadata = metadata;

		cave.setCRS( null );

		const lineSegments = cave.lineSegments;
		const surveyTree   = cave.surveyTree;
		const limits       = cave.limits;
		const projection   = cave.projection;

		const xSects  = [];
		const terrain = {};

		const skipTerrain = ( projection !== null );
		const utf8Decoder = new TextDecoder( 'utf-8' );

		const l = source.byteLength;
		const idOffset = loxHandler.modelOffset;
		const stations = [];
		const shash = [];

		let pos = 0; // file position
		let dataStart;
		const f = new DataView( source, 0 );
		const bytes = new Uint8Array( source );

		let sectionId = 0;
		let lastParentId;
		let parentNode;

		// read file and parse chunk by chunk
		const __coords = {
			x: 0.0,
			y: 0.0
		};

		while ( pos < l ) readChunkHdr();

		// Drop data to give GC a chance ASAP

		source = null;

		cave.addStations( stations );

		cave.addXsects( xSects );

		return Promise.resolve( cave );

		// .lox parsing functions

		function readChunkHdr () {

			const m_type     = readUint();
			const m_recSize  = readUint();
			const m_recCount = readUint();
			const m_dataSize = readUint();

			let doFunction;

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

				throw new Error( 'unknown chunk header. type : ' + m_type );

			}

			for ( let i = 0; i < m_recCount; i++ ) doFunction();

			progress( Math.round( 25 * pos / l ) + 75 );

			pos += m_dataSize;

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

		function readDataPtr () {

			const m_position = readUint();
			const m_size     = readUint();

			return { position: m_position, size: m_size };

		}

		function readString ( ptr ) {

			// strings are null terminated. Ignore last byte in string
			const bytes = new Uint8Array( source, dataStart + ptr.position, ptr.size - 1 );

			return utf8Decoder.decode( bytes );

		}

		function readSurvey () {

			const m_id     = readUint();
			const namePtr  = readDataPtr();
			const m_parent = readUint();
			const titlePtr = readDataPtr();

			if ( lastParentId !== m_parent ) {

				parentNode = surveyTree.findById( ( lastParentId === undefined ) ? 0 : m_parent + idOffset );
				lastParentId = m_parent;

				if ( parentNode === undefined ) parentNode = surveyTree;

			}

			if ( m_parent !== m_id ) {

				const node = parentNode.addById( readString( namePtr ), m_id + idOffset );

				if ( node === null ) throw new Error( 'error constructing survey tree for : ' + readString( titlePtr ) );

				if ( section !== null && node.getPath() === section ) {

					sectionId = m_id;

				}

			}

		}

		function readCoords ( m_flags ) {

			const lastKey = String.fromCharCode.apply( null, bytes.subarray( pos, pos + 24 ) );

			const oldcoords = shash[ lastKey ];

			const coords = new StationPosition(
				readFloat64(),
				readFloat64(),
				readFloat64()
			);

			coords.type = ( m_flags & 0x02 ) ? STATION_ENTRANCE : STATION_NORMAL;

			if ( oldcoords !== undefined ) {

				// mark as a duplicate
				oldcoords.linkStation( coords );

				// create zero length show to preserve topology
				lineSegments.push( { from: oldcoords, to: coords, type: LEG_CAVE, survey: oldcoords.parent.id } );

			} else {

				shash[ lastKey ] = coords;

			}

			if ( projection !== null ) {

				__coords.x = coords.x;
				__coords.y = coords.y;

				const projectedCoords = projection.forward( __coords );

				coords.x = projectedCoords.x;
				coords.y = projectedCoords.y;

			}

			limits.expandByPoint( coords );

			return coords;

		}

		function readStation () {

			const m_id       = readUint();
			const m_surveyId = readUint();
			const namePtr    = readDataPtr();
			const commentPtr = readDataPtr();

			const m_flags = readUint();
			const coords = readCoords( m_flags );

			stations[ m_id ] = coords;

			// add stations to surveyTree make station id negative to avoid clashes with survey id space.

			/*
			.lox station flags
			LXFILE_STATION_FLAG_SURFACE = 1,
			LXFILE_STATION_FLAG_ENTRANCE = 2,
			LXFILE_STATION_FLAG_FIXED = 4,
			LXFILE_STATION_FLAG_CONTINUATION = 8,
			LXFILE_STATION_FLAG_HAS_WALLS = 16,
			*/

			if ( lastParentId !== m_surveyId ) {

				parentNode = surveyTree.findById( m_surveyId + idOffset );
				lastParentId = m_surveyId;

			}

			const name = ( namePtr.size === 0 ) ? '[' + m_id + ']' : readString( namePtr );
			const comment = ( commentPtr.size > 0 ) ? readString( commentPtr ) : null;

			parentNode.addLeafById( name, - ( m_id + idOffset ), coords, comment );

		}

		function readShot () {

			const m_from_r = readUint();
			const m_to_r   = readUint();

			let m_from, m_to, fromLRUD, toLRUD;

			if ( m_to_r > m_from_r ) {

				m_from = m_from_r;
				m_to = m_to_r;
				fromLRUD = readLrudForward();
				toLRUD   = readLrudForward();

			} else {

				m_from = m_to_r;
				m_to = m_from_r;
				toLRUD   = readLrudReverse();
				fromLRUD = readLrudReverse();

			}

			const m_flags       = readUint();
			const m_sectionType = readUint();
			const m_surveyId    = readUint();

			pos += 8; // readFloat64(); // m_threshold

			if ( sectionId !== 0 && m_surveyId !== sectionId ) return;

			/*
			.lox shot flags
			LXFILE_SHOT_FLAG_SURFACE = 1,
			LXFILE_SHOT_FLAG_DUPLICATE = 2,
			LXFILE_SHOT_FLAG_NOT_VISIBLE = 4,
			LXFILE_SHOT_FLAG_NOT_LRUD = 8,
			LXFILE_SHOT_FLAG_SPLAY = 16,
			*/

			let type;

			if ( m_flags === 0 ) {

				type = LEG_CAVE;

			} else if ( m_flags & 0x08 || m_flags & 0x16 ) {

				type = LEG_SPLAY;

			} else if ( m_flags & 0x01 ) {

				type = LEG_SURFACE;

			} else if ( m_flags & 0x02 ) {

				type = LEG_DUPLICATE;

			} else {

				console.log( 'unexpected flags' + m_flags );
				return;

			}

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

			const surveyId = m_surveyId + idOffset;

			if ( m_sectionType !== 0x00 && type === LEG_CAVE ) {

				// record which stations have associated LRUD coords

				const node = surveyTree.findById( - m_to - idOffset );
				node.type = node.type | STATION_XSECT;

				xSects.push( { m_from: m_from, m_to: m_to, start: from, end: to, fromLRUD: fromLRUD, lrud: toLRUD, survey: surveyId, type: m_sectionType } );

			}

			if ( type === LEG_CAVE ) {

				from.connections++;
				to.connections++;

			}

			lineSegments.push( { from: from, to: to, type: type, survey: surveyId } );

		}

		function readLrudForward () {

			return {
				l: readFloat64(),
				r: readFloat64(),
				u: readFloat64(),
				d: readFloat64()
			};

		}

		function readLrudReverse () {

			return {
				r: readFloat64(),
				l: readFloat64(),
				u: readFloat64(),
				d: readFloat64()
			};

		}

		function readScrap () {

			readUint(); // m_id

			const m_surveyId   = readUint();

			const m_numPoints  = readUint();
			const pointsPtr    = readDataPtr();

			const m_num3Angles = readUint();
			const facesPtr     = readDataPtr();

			const scrap = { vertices: [], faces: [], survey: m_surveyId + idOffset };

			let lastFace;
			let i, j;

			if ( sectionId !== 0 && m_surveyId !== sectionId ) return;

			const vDV = new DataView( source, dataStart + pointsPtr.position );

			for ( i = 0; i < m_numPoints; i++ ) {

				const offset = i * 24; // 24 = 3 * sizeof( double )

				scrap.vertices.push( new Vector3(
					vDV.getFloat64( offset,      true ),
					vDV.getFloat64( offset + 8,  true ),
					vDV.getFloat64( offset + 16, true )
				) );

			}

			// read faces from out of line data area
			const fDV = new DataView( source, dataStart + facesPtr.position );

			for ( i = 0; i < m_num3Angles; i++ ) {

				const offset = i * 12; // 12 = 3 * sizeof( uint32 )

				const face = [
					fDV.getUint32( offset,     true ),
					fDV.getUint32( offset + 4, true ),
					fDV.getUint32( offset + 8, true )
				];

				if ( face[ 0 ] == face[ 1 ] || face[ 0 ] == face[ 2 ] || face[ 1 ] == face[ 2 ] ) {
					// some .lox files contain degenerate triangles
					continue;
				}

				// check for face winding order == orientation

				fix_direction: { if ( lastFace !== undefined ) {

					for ( j = 0; j < 3; j++ ) { // this case triggers more often than those below.

						if ( face[ j ] === lastFace[ ( j + 2 ) % 3 ] && face[ ( j + 1 ) % 3 ] === lastFace[ ( j + 3 ) % 3 ] ) {

							face.reverse();
							break fix_direction;

						}

					}

					for ( j = 0; j < 3; j++ ) {

						if ( face[ j ] === lastFace[ j ] && face[ ( j + 1 ) % 3 ] === lastFace[ ( j + 1 ) % 3 ] ) {

							face.reverse();
							break fix_direction;

						}

					}

					for ( j = 0; j < 3; j++ ) {

						if ( face[ j ] === lastFace[ ( j + 1 ) % 3 ] && face[ ( j + 1 ) % 3 ] === lastFace[ ( j + 2 ) % 3 ] ) {

							face.reverse();
							break fix_direction;

						}

					}

				} }

				scrap.faces.push( face );
				lastFace = face;

			}

			cave.scraps.push( scrap );

		}

		function readSurface () {

			readUint(); // m_id

			const m_width  = readUint();
			const m_height = readUint();

			const surfacePtr = readDataPtr();
			const m_calib    = readCalibration();

			if ( skipTerrain ) return;

			const ab = source.slice( pos, pos + surfacePtr.size ); // required for 64b alignment

			const dtm = new Float64Array( ab, 0 );

			terrain.dtm = {
				data: dtm,
				samples: m_width,
				lines:   m_height,
				calib:   m_calib
			};

			cave.terrains.push( terrain );
			cave.hasTerrain = true;

		}

		function readCalibration () {

			const xOrigin =	readFloat64(); // x origin
			const yOrigin =	readFloat64(); // y origin
			const xx = readFloat64(); // xx ( 2 x 2 ) rotate and scale matrix
			const xy = readFloat64(); // xy "
			const yx = readFloat64(); // yx "
			const yy = readFloat64(); // yy "

			return {
				xOrigin: xOrigin,
				yOrigin: yOrigin,
				xx: xx,
				xy: xy,
				yx: yx,
				yy: yy
			};

		}

		function readSurfaceBMP () {

			readUint(); // m_type
			readUint(); // m_surfaceId

			const imagePtr = readDataPtr();
			const m_calib = readCalibration();

			if ( skipTerrain ) return;

			terrain.bitmap = {
				image: extractImage( imagePtr ),
				calib: m_calib
			};

		}

		function extractImage ( imagePtr ) {

			const imgData = new Uint8Array( source, dataStart + imagePtr.position, imagePtr.size );

			const b1 = imgData[ 0 ];
			const b2 = imgData[ 1 ];

			let type;

			if ( b1 === 0xff && b2 === 0xd8 ) {

				type = 'image/jpeg';

			} else if ( b1 === 0x89 && b2 === 0x50 ) {

				type = 'image/png';

			} else {

				return '';

			}

			const blob = new Blob( [ imgData ], { type: type } );

			return URL.createObjectURL( blob );

		}

	}

}

export { loxHandler };