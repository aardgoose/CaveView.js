import { Tree } from '../core/Tree';
import { Box3, Vector3 } from '../Three';

import proj4 from 'proj4';

class Handler {

	constructor ( ctx ) {

		this.surveyTree = new Tree();
		this.limits     = new Box3();
		this.offsets    = new Vector3();
		this.allStations  = [];
		this.lineSegments = [];
		this.xGroups      = [];
		this.scraps     = [];
		this.terrains   = [];
		this.sourceCRS  = null;
		this.targetCRS  = 'EPSG:3857'; // "web mercator"
		this.displayCRS = null;
		this.projection = null;
		this.hasTerrain  = false;
		this.messages = [];
		this.metadata = null;
		this.fileCount = 0;
		this.splayFix = false;
		this.ctx = ctx;

	}

	setCRS ( sourceCRS ) {

		if ( sourceCRS !== null ) {

			// work around lack of +init string support in proj4js

			const matches = sourceCRS.match( /\+init=(.*)\s/ );

			if ( matches && matches.length === 2 ) {

				const init = matches[ 1 ];
				let code;

				switch ( init ) {

				case 'epsg:27700' :

					sourceCRS = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs';

					break;

				default:

					code = init.match( /(epsg|esri):([0-9]+)/ );

					if ( code !== null ) {

						console.log( 'looking up CRS code EPSG:' + code [ 1 ] );

						return fetch( 'https://epsg.io/' + code[ 1 ] + '.proj4' )
							.then( response => {

								return response.text();

							} ).then( text => {

								this._setCRS( text );

							} ).catch( function () { console.log( 'CRS lookup failed' ); } );

					} else {

						console.log( 'Unsupported projection:', sourceCRS );
						sourceCRS = null;

					}

				}

			}

		}

		this._setCRS( sourceCRS );

		return Promise.resolve( null );

	}

	_setCRS ( sourceCRS ) {

		const cfg = this.ctx.cfg;
		const displayCRS = cfg.value( 'displayCRS', 'EPSG:3857' );

		if ( sourceCRS === null ) {

			sourceCRS = cfg.value( 'defaultCRS', null );

			if ( sourceCRS !== null ) console.log( 'Using default projection.' );

		}

		// FIXME use NAD grid corrections OSTM15 etc ( UK Centric )
		if ( sourceCRS !== null ) {

			this.sourceCRS = sourceCRS;

			if ( displayCRS === 'ORIGINAL' ) {

				this.displayCRS = 'ORIGINAL';

			} else {

				console.log( 'Reprojecting from', sourceCRS, 'to', this.targetCRS );

				this.projection = proj4( this.sourceCRS, this.targetCRS );
				this.displayCRS = this.targetCRS;

			}

		}

	}

	addStations ( stations ) {

		this.fileCount++;

		this.allStations.push( stations );

	}

	addLineSegments ( groups ) {

		const lineSegments = this.lineSegments;
		const l = groups.length;

		for ( let i = 0; i < l; i++ ) {

			const g = groups[ i ];
			const vMax = g.length - 1;

			for ( let v = 0; v < vMax; v++ ) {

				// create vertex pairs for each line segment.
				// all vertices except first and last are duplicated.
				const from = g[ v ];
				const to   = g[ v + 1 ];

				const fromCoords = from.coords;
				const toCoords = to.coords;

				lineSegments.push( { from: fromCoords, to: toCoords, type: to.type, survey: to.survey } );

			}

		}

	}

	addXsects ( xSects ) {

		const xGroups = [];
		const ends = [];

		let lastTo, xGroup;

		xSects.sort( function ( a, b ) { return a.m_from - b.m_from; } );

		for ( let i = 0; i < xSects.length; i++ ) {

			const xSect = xSects[ i ];

			if ( xSect.m_from !== lastTo ) {

				xGroup = [];
				xGroups.push( xGroup );

			}

			lastTo = xSect.m_to;

			xGroup.push( xSect );

		}

		for ( let i = 0; i < xGroups.length; i++ ) {

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

		for ( let i = 0; i < xGroups.length; i++ ) {

			const group = xGroups[ i ];

			if ( group.length < 2 ) continue;

			const xSect = group[ 0 ];
			const xSectNext = group[ 1 ];

			if ( xSect === undefined ) continue; // groups that have been merged

			const start = xSectNext.start;
			const end = xSectNext.end;

			// fake approach vector for initial xSect ( mirrors first section vector )

			xSect.start = new Vector3().copy( start ).multiplyScalar( 2 ).sub( end );

			// add to model
			this.xGroups.push( group );

		}

	}

	enableSplayFix () {

		this.splayFix = true;

	}

	getSurvey () {

		const limits = this.limits;

		if ( ! this.hasTerrain ) {

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

		}

		// convert to origin centered coordinates

		const offsets = limits.getCenter( this.offsets );
		const allStations = this.allStations;

		allStations.forEach( all => all.forEach( s => s.sub( offsets ) ) );

		// convert scraps if present

		const scraps = this.scraps;

		// covert scraps coordinates

		for ( let i = 0; i < scraps.length; i++ ) {

			const vertices = scraps[ i ].vertices;

			for ( let j = 0; j < vertices.length; j++ ) {

				vertices[ j ].sub( offsets );

			}

		}

		return {
			title: this.fileName,
			surveyTree: this.surveyTree,
			sourceCRS: this.sourceCRS,
			displayCRS: this.displayCRS,
			lineSegments: this.lineSegments,
			crossSections: this.xGroups,
			scraps: this.scraps,
			hasTerrain: this.hasTerrain,
			metadata: this.metadata,
			terrains: this.terrains,
			limits: this.limits,
			offsets: this.offsets,
			splayFix: this.splayFix
		};

	}

}

export { Handler };