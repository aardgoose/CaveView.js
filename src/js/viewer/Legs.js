import { Float32BufferAttribute } from '../Three';
import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { LineSegments2 } from '../core/LineSegments2';
import { STATION_XSECT } from '../core/constants';
import { Segments } from './Segments';

class Legs extends LineSegments2 {

	constructor ( ctx ) {

		const geometry = new LineSegmentsGeometry();

		super( geometry, ctx.materials.getSurveyLineMaterial( 'basic' ) );

		this.ctx = ctx;
		this.colourCache = ctx.materials.colourCache;
		this.legLengths = [];
		this.legVertices = [];
		this.legToSegment = []; // maps vertex index to segment membership
		this.colors = [];
		this.type = 'Legs';
		this.highlightLeg = null;
		this.highlightSegment = null;
		this.scale.set( 1, 1, 1 );
		this.pathsSet = false;

	}

	addLegs ( survey, vertices, legRuns ) {

		this.legVertices = vertices;
		this.legRuns = legRuns;

		const positions = new Float32BufferAttribute( vertices.length * 3, 3 );
		const colors = new Float32BufferAttribute( vertices.length * 3, 3 );

		positions.copyVector3sArray( vertices );
		colors.array.fill( 1.0 );

		const geometry = this.geometry;

		geometry.setPositions( positions.array );
		geometry.setColors( colors.array );

		this.computeLineDistances();
		this.computeStats( survey );

		this.colors = colors;

		return this;

	}

	computeStats ( survey ) {

		const vertices = this.legVertices;
		const l = vertices.length;

		const n = l / 2;
		const legLengths = new Array( n );

		let s1 = 0, s2 = 0;
		let min = Infinity;
		let max = -Infinity;

		for ( let i = 0; i < l; i += 2 ) {

			const v1 = vertices[ i ];
			const v2 = vertices[ i + 1 ];

			const legLength = survey.getGeographicalDistance( v1, v2 );

			legLengths[ i / 2 ] = legLength; // cache lengths to avoid recalc

			s1 += legLength;
			s2 += legLength * legLength;

			max = Math.max( max, legLength );
			min = Math.min( min, legLength );

		}

		const stats = {
			minLegLength: min,
			maxLegLength: max,
			legLength: s1,
			legLengthSD: Math.sqrt( s2 / n - Math.pow( s1 / n, 2 ) ),
			legLengthRange: max - min,
			legCount: n
		};

		this.legLengths = legLengths;
		this.stats = stats;

		return this;

	}

	cutRuns ( survey, selection ) {

		const idSet = selection.getIds();
		const legRuns = this.legRuns;

		if ( ! legRuns ) return;

		const vertices = this.legVertices;

		const newVertices = [];
		const newLegRuns = [];

		const l = legRuns.length;

		for ( let run = 0; run < l; run++ ) {

			const legRun = legRuns[ run ];

			const survey = legRun.survey;
			const start  = legRun.start;
			const end    = legRun.end;

			let vp = 0;

			if ( idSet.has( survey ) ) {

				for ( let v = start; v < end; v++ ) {

					const station = vertices[ v ];

					newVertices.push( station );

					//  clear topology info
					station.legs = [];
					station.linkedSegments = [];


				}

				// adjust vertex run for new vertices and color arrays

				legRun.start = vp;

				vp += end - start;

				legRun.end = vp;

				newLegRuns.push( legRun );

			}

		}

		if ( newVertices.length === 0 ) return false;

		this.geometry.dispose();

		this.addLegs( survey, newVertices, newLegRuns );

		return true;

	}

	setHighlightLeg ( l ) {

		this.highlightLeg = l;

	}

	setHighlightSegment ( l ) {

		this.highlightSegment = l;

	}

	setShading ( idSet, colourSegment, mode, dashed, filterConnected ) {

		this.material = this.ctx.materials.getSurveyLineMaterial( mode, dashed );
		this.material.needsUpdate = true;

		const legRuns = this.legRuns;
		const unselectedColor = this.ctx.cfg.themeColor( 'shading.unselected' );

		const vertices = this.legVertices;
		const colors = this.colors.array;
		const highlightLeg = this.highlightLeg === null ? null : this.highlightLeg * 2;
		const highlightSegment = this.highlightSegment;

		if ( idSet.size > 0 && legRuns ) {

			for ( let run = 0, l = legRuns.length; run < l; run++ ) {

				const legRun = legRuns[ run ];

				const survey = legRun.survey;
				const start  = legRun.start;
				const end    = legRun.end;

				if ( idSet.has( survey ) ) {

					for ( let v = start; v < end; v += 2 ) {

						colourSegment( vertices, colors, v, v + 1, survey );

					}

				} else {

					for ( let v = start; v < end; v++ ) {

						unselectedColor.toArray( colors, v * 3 );

					}

				}

			}

		} else {

			const segments = this.legToSegment;

			for ( let v1 = 0, l = vertices.length; v1 < l; v1 += 2 ) {

				const v2 = v1 + 1;

				if (
					( highlightLeg !== null && v1 !== highlightLeg ) ||
					( highlightSegment !== null && segments[ v1 / 2 ] !== highlightSegment ) ||
					( filterConnected && ( vertices[ v1 ].shortestPath === Infinity || vertices[ v2 ].shortestPath === Infinity ) )
				) {

					unselectedColor.toArray( colors, v1 * 3 );
					unselectedColor.toArray( colors, v2 * 3 );

				} else {

					colourSegment( vertices, colors, v1, v2, null );

				}

			}

		}

		this.geometry.getAttribute( 'instanceColorStart' ).needsUpdate = true;
		this.geometry.getAttribute( 'instanceColorEnd' ).needsUpdate = true;

	}

	hide ( mode ) {

		if ( mode ) {

			const vertices = this.legVertices;
			const legCount = vertices.length / 2;

			const hide = new Float32Array( legCount );

			for ( let i = 0; i < legCount; i++ ) {

				const sType1 = vertices[ i * 2 ].type;
				const sType2 = vertices[ i * 2 + 1 ].type;

				hide[ i ] = sType1 & STATION_XSECT && sType2 & STATION_XSECT ? 1 : 0;

			}

			this.geometry.setHide( hide );

		} else {

			this.geometry.clearHide();

		}

	}

	vertexSegment ( index ) {

		return this.legToSegment[ index / 2 ];

	}

	getLegInfo ( legIndex ) {

		const vertices = this.legVertices;
		const vertexIndex = legIndex * 2;

		return {
			index: legIndex,
			start: vertices[ vertexIndex ],
			end: vertices[ vertexIndex + 1 ],
			segment: this.legToSegment[ legIndex ],
			length: this.legLengths[ legIndex ]
		};

	}

	setLegColor ( leg, color1, color2 = null ) {

		const c1 = this.colourCache.getColour( color1 );
		const c2 = ( ! color2 ) ? c1 : this.colourCache.getColour( color2 );

		const colours = this.colors.array;

		leg *= 3;
		c1.toArray( colours, leg );
		c2.toArray( colours, leg + 3 );

		this.geometry.getAttribute( 'instanceColorStart' ).needsUpdate = true;
		this.geometry.getAttribute( 'instanceColorEnd' ).needsUpdate = true;

	}

	findTopology () {

		// determine segments between junctions and entrances/passage ends and create mapping array.

		const legs = this.legVertices;
		const legLengths = this.legLengths;
		const segments = new Segments();

		const l = legs.length;

		this.legToSegment = new Array( l / 2 );

		const legToSegment = this.legToSegment;

		let station;
		let newSegment = true;
		let segment = 0;
		let segmentInfo;

		for ( let i = 0; i < l; i = i + 2 ) {

			const v1 = legs[ i ];
			const v2 = legs[ i + 1 ];

			legToSegment[ i / 2 ] = segment;

			station = v1;

			if ( station !== undefined ) {

				station.legs.push( i );
				station.linkedSegments.push( segment );

			}

			if ( newSegment ) {

				if ( station === undefined ) continue; // possible use of separator in station name.

				segmentInfo = {
					segment: segment,
					startStation: station,
					endStation: null,
					length: 0
				};

				newSegment = false;

			}

			segmentInfo.length += legLengths[ i / 2 ];

			station = v2;

			if ( station !== undefined ) station.legs.push( i );

			if ( station && ( station.connections > 2 || ( i + 2 < l && ! station.equals( legs[ i + 2 ] ) ) ) ) {

				// we have found a junction or a passage end

				_addSegment();

				segment++;
				newSegment = true;

			}

		}

		if ( ! newSegment ) {

			_addSegment();

		}

		return segments;

		function _addSegment() {

			segmentInfo.endStation = station;

			segments.addSegment( segmentInfo );

			station.linkedSegments.push( segment );

		}

	}

	getAdjacentStations ( station ) {

		const legs = this.legVertices;
		const adjacentLegs = station.legs;
		const thisVertex = station;
		const ids = [];

		if ( ! adjacentLegs ) return ids;

		adjacentLegs.forEach( l => {

			const v1 = legs[ l ];
			const nextVertex = ( v1 === thisVertex ) ? legs[ l + 1 ] : v1;

			ids.push( nextVertex.id );

		} );

		return ids;

	}

	setShortestPaths ( station, legCallback = null ) {

		// queue of stations searched.
		const queue = [ station ];

		const legs = this.legVertices;
		const legLengths = this.legLengths;
		const legsSeen = [];

		let maxDistance = 0;

		station.shortestPath = 0;

		while ( queue.length > 0 ) {

			const station = queue.shift();
			const stationLegs = station.legs;

			const currentDistance = station.shortestPath;

			maxDistance = Math.max( maxDistance, currentDistance );

			// find stations connected to this station
			for ( let i = 0; i < stationLegs.length; i++ ) {

				const leg = stationLegs[ i ];

				const v1 = legs[ leg ];

				const legIndex = leg / 2;
				const nextStation = ( v1 === station ) ? legs[ leg + 1 ] : v1;
				const nextLength = legLengths[ legIndex];

				if ( legCallback !== null && ! legsSeen[ leg ] ) {

					legCallback( this.getLegInfo( legIndex ) );
					legsSeen[ leg ] = true;

				}

				// label stations with distance of shortest path
				// add to search list

				if ( nextStation.shortestPath > currentDistance + nextLength ) {

					nextStation.shortestPath = currentDistance + nextLength;
					queue.push( nextStation );

				}

			}

		}

		this.pathsSet = true;

		return maxDistance;

	}

	getShortestPath ( startStation ) {

		const path = new Set();

		let shortestPath = startStation.shortestPath;

		if (
			! this.pathsSet ||
			shortestPath === Infinity ||
			shortestPath === 0
		) return path;

		const legs = this.legVertices;

		_shortestPathSearch( null, startStation );

		return path;

		function _shortestPathSearch ( lastStation, station ) {

			const stationLegs = station.legs;
			const l = stationLegs.length;

			for ( let i = 0; i < l; i++ ) {

				const leg = stationLegs[ i ];
				const v1 = legs[ leg ];

				const nextStation = ( v1 === station ) ? legs[ leg + 1 ] : v1;

				// prevent loops with zero length legs
				if ( nextStation === lastStation ) continue;

				// '<=' to search via zero length legs
				if ( nextStation.shortestPath <= shortestPath ) {

					shortestPath = nextStation.shortestPath;

					path.add( leg );

					if ( nextStation.shortestPath === 0 ) {

						return;

					} else {

						_shortestPathSearch( station, nextStation );

					}


				}

			}

		}

	}

	forEachLeg ( callback ) {

		const l = this.legLengths.length;

		for ( let i = 0; i < l; i++ ) {
			callback ( this.getLegInfo( i ) );
		}

	}

}

export { Legs };