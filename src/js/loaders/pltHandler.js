import { LEG_CAVE, STATION_NORMAL } from '../core/constants';
import { StationPosition } from '../core/StationPosition';

const ftom = 12 * 0.0254;

class pltHandler {

	constructor( fileName ) {

		this.fileName = fileName;
		this.type = 'text';

	}

	parse ( cave, dataStream, metadata /*, section */ ) {

		cave.metadata = metadata;

		cave.setCRS( null );

		const surveyTree  = cave.surveyTree;
		const limits      = cave.limits;
		const projection  = cave.projection;

		const stationMap  = new Map();
		const xSects      = [];
		const stations    = [];
		const groups      = [];

		const lines = dataStream.split( /[\n\r]+/ );
		const l = lines.length;

		let path = [];
		let segments = [];
		let stationName;
		let surveyName;
		let surveyId = 0;
		let lastStationIndex = -1;
		let section = 'root';
		let lrud, stationIndex, coords;

		for ( let i = 0; i < l; i++ ) {

			const parts = lines[ i ].split( /\s+/ );

			const cmd = parts[ 0 ].charAt( 0 );

			switch ( cmd ) {

			case 'M': // move

				if ( segments.length > 1 ) groups.push( segments );

				segments = [];
				lastStationIndex = -1;

			case 'D': // eslint-disable-line no-fallthrough

				stationName = parts[ 4 ].substring( 1 );

				path[ 2 ] = stationName;

				coords = readCoords( parts );
				stationIndex = coords.stationIndex;

				segments.push( { coords: coords, type: LEG_CAVE, survey: surveyId } );

				if ( coords.connections === 0 ) {

					// parse comment
					const comment = ( parts[ 13 ] === undefined ) ? null : parts.slice( 13 ).join( ' ' );

					surveyTree.addLeaf( path, STATION_NORMAL, coords, comment );

				}

				coords.connections++;

				if ( parts[ 5 ] === 'P' ) {

					let l = +parts[ 6 ];
					let u = +parts[ 7 ];
					let d = +parts[ 8 ];
					let r = +parts[ 9 ];

					let nCount = 0;

					if ( l < 0 ) { l = 0; nCount++; }
					if ( u < 0 ) { u = 0; nCount++; }
					if ( d < 0 ) { d = 0; nCount++; }
					if ( r < 0 ) { r = 0; nCount++; }

					if ( nCount !== 4 ) {

						lrud = {
							l: l * ftom,
							u: u * ftom,
							d: d * ftom,
							r: r * ftom
						};

						const from = ( lastStationIndex !== -1 ) ? stations[ lastStationIndex ] : null;

						xSects.push( { m_from: lastStationIndex, m_to: stationIndex, start: from, end: coords, lrud: lrud, survey: surveyId, type: 2  } );

					}

					lastStationIndex = stationIndex;

				}

				break;

			case 'N': // line survey

				surveyName = parts[ 0 ].substring( 1 );

				path = [ section, surveyName ];
				surveyId = surveyTree.addPath( section + '.' + surveyName ).id;

				break;

			case 'Z': // end of survey

				/*
				limits.min.set(
					+parts[ 3 ],
					+parts[ 1 ],
					+parts[ 5 ]
				);

				limits.max.set(
					+parts[ 4 ],
					+parts[ 2 ],
					+parts[ 6 ]
				);
				*/

				break;

			case 'F': // feature survey
			case 'L': // feature location
			case 'X': // end of survey
			case 'O': // Datum
			case 'G': // UTM Zone
			case 'P': // fixed point
			case 'R': // loop spec
			case 'C': // loop count
			case '\x1A': // end of file

				break;

			case 'S':

				section = lines[ i ].substring( 1 );
				break;

			default:

				console.log( 'unknown command ', cmd );

			}

		}

		if ( segments.length > 1 ) groups.push( segments );

		cave.addStations( stations );

		cave.addLineSegments( groups );

		cave.addXsects( xSects );

		return Promise.resolve( cave );

		function readCoords( parts ) {

			const lastKey = parts[ 1 ] + ':' + parts[ 2 ] + ':' + parts[ 3 ];
			const cachedCoords = stationMap.get( lastKey );

			let coords;

			if ( cachedCoords !== undefined ) {

				coords = cachedCoords;

			} else {

				coords = new StationPosition(
					+parts[ 2 ] * ftom,
					+parts[ 1 ] * ftom,
					+parts[ 3 ] * ftom
				);

				if ( projection !== null ) {

					const projectedCoords = projection.forward( {
						x: coords.x,
						y: coords.y
					} );

					coords.x = projectedCoords.x;
					coords.y = projectedCoords.y;

				}

				coords.stationIndex = stations.length;

				stations.push( coords );
				stationMap.set( lastKey, coords );

				limits.expandByPoint( coords );

			}

			return coords;

		}

	}

}

export { pltHandler };