
import { Vector3 } from '../Three';

const HandlerLib = {

	addLineSegments: function ( groups, lineSegments ) {

		const l = groups.length;

		var i;

		for ( i = 0; i < l; i++ ) {

			const g = groups[ i ];

			let v, vMax = g.length - 1;

			for ( v = 0; v < vMax; v++ ) {

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

	},


	procXsects: function ( xSects ) {

		const xGroups = [];
		const ends = [];

		var lastTo, xGroup, i;

		xSects.sort( function ( a, b ) { return a.m_from - b.m_from; } );

		for ( i = 0; i < xSects.length; i++ ) {

			const xSect = xSects[ i ];

			if ( xSect.m_from !== lastTo ) {

				xGroup = [];
				xGroups.push( xGroup );

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

			if ( group.length < 2 ) continue;

			const xSect = group[ 0 ];
			const xSectNext = group[ 1 ];

			if ( xSect === undefined ) continue; // groups that have been merged

			const start = xSectNext.start;
			const end = xSectNext.end;

			// fake approach vector for initial xSect ( mirrors first section vector )

			xSect.start = new Vector3().copy( start ).multiplyScalar( 2 ).sub( end );

		}

		return xGroups;

	}

};

export { HandlerLib };


// EOF