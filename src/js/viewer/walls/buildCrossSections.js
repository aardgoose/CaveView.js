import { FACE_WALLS, WALL_DIAMOND, WALL_SQUARE, WALL_OVAL } from '../../core/constants';
import { Walls } from './Walls';

import { Object3D, Vector3 } from '../../Three';

function buildCrossSections ( cave, survey ) {

	const crossSectionGroups = cave.crossSections;
	const legs = survey.getLegs();
	const ctx = survey.ctx;

	const vSectMap = new Map();
	const fixupXsects = ctx.cfg.value( 'fixup_xsects', true );

	// map stations to XSECT
	crossSectionGroups.forEach( group => {
		group.forEach( section => {
			vSectMap.set( section.end, section );
		} );
	} );

	// handle no LRUD sections
	if ( crossSectionGroups.length === 0 ) return;

	const warnings = [];
	const mesh = survey.addFeature( new Walls( ctx ), FACE_WALLS, 'Walls' );

	const indices = [];
	const vertices = [];

	const l = crossSectionGroups.length;

	// survey to face index mapping
	const indexRuns = [];
	const upAxis = Object3D.DefaultUp;

	let currentSurvey;

	let v = 0;

	let lastEnd = 0;
	let l1, r1, u1, d1, l2, r2, u2, d2;
	let ul1, ur1, dl1, dr1, ul2, ur2, dl2, dr2;

	const cross = new Vector3();
	const lastCross = new Vector3();
	const nextCross = new Vector3();

	let run = null;

	let vertexCount; // number of vertices per section

	for ( let i = 0; i < l; i++ ) {

		const crossSectionGroup = crossSectionGroups[ i ];

		if ( crossSectionGroup.length < 2 ) continue;

		if ( crossSectionGroup[ 0 ].start === null ) {

			// no approach vector
			_fixupGroupStart( crossSectionGroup );

		}

		if ( fixupXsects ) _fixupGroupEnd( crossSectionGroup );

		// enter first station vertices
		const m = crossSectionGroup.length;

		vertexCount = _getLRUD( crossSectionGroup[ 0 ], crossSectionGroup[ 1 ] );

		for ( let j = 1; j < m; j++ ) {

			const xSect = crossSectionGroup[ j ];
			const survey = xSect.survey;

			vertexCount = _getLRUD( xSect, crossSectionGroup[ j + 1 ] );

			if ( survey !== currentSurvey ) {

				currentSurvey = survey;

				if ( run !== null ) {

					_endCap();

					lastEnd = indices.length;

					run.count = lastEnd - run.start;

					indexRuns.push( run );

					run = null;

				}

			}

			// next station vertices

			// triangles to form passage box
			l1 = v++;
			r1 = v++;
			u1 = v++;
			d1 = v++;

			if ( vertexCount === 8 ) {

				ul1 = v++;
				dr1 = v++;
				ur1 = v++;
				dl1 = v++;

			} else {

				ul1 = l1;
				dr1 = r1;
				ur1 = r1;
				dl1 = l1;

			}

			l2 = v++;
			r2 = v++;
			u2 = v++;
			d2 = v++;

			if ( vertexCount === 8 ) {

				ul2 = v++;
				dr2 = v++;
				ur2 = v++;
				dl2 = v++;

			} else {

				ul2 = l1;
				dr2 = r1;
				ur2 = r1;
				dl2 = l1;

			}

			// all face vertices specified in CCW winding order to define front side.

			if ( vertexCount === 4 ) {

				// top faces
				indices.push( u1, r1, r2 );
				indices.push( u1, r2, u2 );
				indices.push( u1, u2, l2 );
				indices.push( u1, l2, l1 );

				// bottom faces
				indices.push( d1, r2, r1 );
				indices.push( d1, d2, r2 );
				indices.push( d1, l2, d2 );
				indices.push( d1, l1, l2 );

			} else {

				// top faces - top half
				indices.push( u1, ur1, ur2 );
				indices.push( u1, ur2, u2 );
				indices.push( u1, u2,  ul2 );
				indices.push( u1, ul2, ul1 );

				// top faces - bottom half
				indices.push( ur1, r1, r2 );
				indices.push( ur1, r2, ur2 );
				indices.push( ul1, ul2, l2 );
				indices.push( ul1, l2, l1 );

				// bottom faces - top half
				indices.push( dr1, r2,  r1 );
				indices.push( dr1, dr2, r2 );
				indices.push( dl1, l2, dl2 );
				indices.push( dl1, l1, l2 );

				// bottom faces - bottom half
				indices.push( d1, dr2, dr1 );
				indices.push( d1, d2,  dr2 );
				indices.push( d1, dl2, d2 );
				indices.push( d1, dl1, dl2 );

			}

			v = v - vertexCount; // rewind to allow current vertices to be start of next box section.

			if ( run === null ) {

				// handle first section of run

				run = { start: lastEnd, survey: survey };

				// start tube with two triangles to form cap
				indices.push( u1, d1, r1 );
				indices.push( u1, l1, d1 );

				if ( vertexCount === 8 ) {

					indices.push( u1, ul1, l1 );
					indices.push( u1, r1, ur1 );
					indices.push( d1, l1, dl1 );
					indices.push( d1, dr1, r1 );

				}

			}

		}

		currentSurvey = null;
		v = v + vertexCount; // advance because we are starting a new set of independant x-sections.

	}

	if ( run !== null ) {

		_endCap();

		run.count = indices.length - run.start;

		indexRuns.push( run );

	}

	if ( indices.length === 0 ) return;

	mesh.addWalls( vertices, indices, indexRuns );

	survey.addFeature( mesh, FACE_WALLS, 'CV.Survey:faces:walls' );
	survey.loadWarnings( warnings );

	return;

	function _endCap() {

		// close tube with two triangles
		indices.push( u2, r2, d2 );
		indices.push( u2, d2, l2 );

		if ( vertexCount === 8 ) {

			indices.push( u2, l2, ul2 );
			indices.push( u2, ur2, r2 );
			indices.push( d2, dl2, l2 );
			indices.push( d2, r2, dr2 );

		}

	}

	function _getLRUD ( crossSection, nextSection ) {

		const ovalFactor = 0.293;
		const station = crossSection.end;
		const lrud    = crossSection.lrud;

		let vertexCount;

		// cross product of leg + next leg vector and up AXIS to give direction of LR vector
		cross.subVectors( crossSection.start, crossSection.end ).normalize();

		const vertical = ( Math.abs( cross.dot( upAxis ) ) > 0.97 );

		if ( nextSection ) {

			nextCross.subVectors( nextSection.start, nextSection.end ).normalize();
			cross.add( nextCross );

		}

		cross.cross( upAxis );

		let U, D, UL, UR, DL, DR;

		if ( vertical && ( lrud.u + lrud.d < 5 ) ) {

			cross.copy( lastCross );
			const t = cross.clone().cross( upAxis );

			U = t.clone().setLength( -lrud.u ).add( station );
			D = t.clone().setLength( lrud.d ).add( station );

		} else {

			U = new Vector3( station.x, station.y, station.z + lrud.u );
			D = new Vector3( station.x, station.y, station.z - lrud.d );

		}

		const L = cross.clone().setLength(  lrud.l ).add( station );
		const R = cross.clone().setLength( -lrud.r ).add( station );

		lastCross.copy( cross );

		switch ( crossSection.type ) {

		case WALL_DIAMOND:

			vertices.push( L, R, U, D );

			vertexCount = 4; // number of vertices for this profile
			break;

		case WALL_SQUARE:

			UL = L.clone().setZ( U.z );
			UR = R.clone().setZ( U.z );
			DL = L.clone().setZ( D.z );
			DR = R.clone().setZ( D.z );

			vertices.push( UL, DR, UR, DL );

			vertexCount = 4; // number of vertices for this profile
			break;

		case WALL_OVAL:

			vertices.push( L, R, U, D );

			UL = L.clone().setZ( U.z ).lerp( station, ovalFactor );
			UR = R.clone().setZ( U.z ).lerp( station, ovalFactor );
			DL = L.clone().setZ( D.z ).lerp( station, ovalFactor );
			DR = R.clone().setZ( D.z ).lerp( station, ovalFactor );

			vertices.push( UL, DR, UR, DL );

			vertexCount = 8; // number of vertices for this profile
			break;

		default:

			console.error( 'unsupported lrud shape', crossSection.type );

		}

		return vertexCount;

	}

	function _fixupGroupStart( group ) {

		let crossSection = group[ 0 ];
		let nextSection = group[ 1 ];

		if ( fixupXsects ) {

			// fixup start of group - connect other passages if possible
			// no approach vector

			// do we have more than one connected station?
			const connectedPoint = _getConnectedPoint ( crossSection.end, nextSection.end );

			if ( connectedPoint ) {

				crossSection.start = connectedPoint;

				const newXsect = vSectMap.get( connectedPoint );

				if ( newXsect ) {

					// we can add a new xsect to the start
					nextSection = crossSection;

					crossSection = {
						start: null,
						end: connectedPoint,
						lrud: newXsect.lrud,
						type: WALL_SQUARE
					};

					group.unshift( crossSection );

					warnings.push( {
						station: nextSection.start,
						text: 'xSects start extended'
					} );

				}

			}

		}

		// drop through here if no new xsect added or no connected points found
		// reverse next leg for approach vector

		crossSection.start = new Vector3()
			.copy( nextSection.start )
			.multiplyScalar( 2 ).sub( nextSection.end );

	}

	function _fixupGroupEnd( group ) {

		const endSection = group[ group.length - 1 ];
		const connectedPoint = _getConnectedPoint( endSection.end, endSection.start );

		if ( ! connectedPoint ) return;

		const newXsect = vSectMap.get( connectedPoint );

		if ( newXsect === undefined ) return;

		group.push( {
			start: endSection.end,
			end: connectedPoint,
			lrud: newXsect.lrud,
			survey: newXsect.survey,
			type: newXsect.type
		} );

		warnings.push( {
			station: endSection.end,
			text: 'xSects end extended'
		} );

	}

	function _getConnectedPoint ( vertex, excludeVertex ) {

		const nodeLegs = vertex.legs;

		if ( nodeLegs.length === 0 ) return false;

		const connectedPoints = [];

		nodeLegs.forEach( li => {

			// leg index points to first vertex of leg
			const p = ( legs[ li ] !== vertex ) ? legs[ li ] : legs[ li + 1 ];
			if ( p !== excludeVertex ) connectedPoints.push( p );

		} );

		return connectedPoints[ 0 ];

	}

}

export { buildCrossSections };