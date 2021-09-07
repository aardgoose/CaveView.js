import { Float32BufferAttribute } from '../Three';
import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { LineSegments2 } from '../core/LineSegments2';
import { STATION_XSECT } from '../core/constants';

class Legs extends LineSegments2 {

	constructor ( ctx ) {

		const geometry = new LineSegmentsGeometry();

		super( geometry, ctx.materials.getSurveyLineMaterial( 'basic' ) );

		this.ctx = ctx;
		this.legLengths = [];
		this.legVertices = [];
		this.colors = [];
		this.type = 'Legs';
		this.highlightLeg = null;
		this.scale.set( 1, 1, 1 );

	}

	addLegs ( vertices, legRuns ) {

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
		this.computeStats();

		this.colors = colors;

		return this;

	}

	computeStats () {

		const stats = { maxLegLength: -Infinity, minLegLength: Infinity, legCount: 0, legLength: 0 };
		const vertices = this.legVertices;
		const l = vertices.length;

		const n = l / 2;
		const legLengths = new Array( n );

		let s1 = 0, s2 = 0;

		for ( let i = 0; i < l; i += 2 ) {

			const vertex1 = vertices[ i ];
			const vertex2 = vertices[ i + 1 ];

			const legLength = vertex1.correctedDistanceTo( vertex2 );

			legLengths[ i / 2 ] = legLength; // cache lengths to avoid recalc

			s1 += legLength;
			s2 += legLength * legLength;

			stats.maxLegLength = Math.max( stats.maxLegLength, legLength );
			stats.minLegLength = Math.min( stats.minLegLength, legLength );

		}

		stats.legLength = s1;
		stats.legLengthSD = Math.sqrt( s2 / n - Math.pow( s1 / n, 2 ) );
		stats.legLengthRange = stats.maxLegLength - stats.minLegLength;
		stats.legCount = n;

		this.legLengths = legLengths;
		this.stats = stats;

		return this;

	}

	cutRuns ( selection ) {

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

					newVertices.push( vertices[ v ] );

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

		this.addLegs( newVertices, newLegRuns );

		return true;

	}

	setHighlightLeg ( l ) {

		this.highlightLeg = l;

	}

	setShading ( idSet, colourSegment, mode, dashed, filterConnected ) {

		this.material = this.ctx.materials.getSurveyLineMaterial( mode, dashed );
		this.material.needsUpdate = true;

		const legRuns = this.legRuns;
		const unselectedColor = this.ctx.cfg.themeColor( 'shading.unselected' );

		const vertices = this.legVertices;
		const colors = this.colors.array;
		const highlightLeg = this.highlightLeg === null ? null : this.highlightLeg * 2;

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

			for ( let v1 = 0, l = vertices.length; v1 < l; v1 += 2 ) {

				const v2 = v1 + 1;

				if (
					( highlightLeg !== null && v1 !== highlightLeg ) ||
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

			const stations = this.ctx.survey.stations;
			const vertices = this.legVertices;

			const l = vertices.length;

			const hide = [];

			for ( let i = 0; i < l; i = i + 2 ) {

				const sType1 = stations.getStation( vertices[ i ] ).type;
				const sType2 = stations.getStation( vertices[ i + 1 ] ).type;

				hide.push( sType1 & STATION_XSECT && sType2 & STATION_XSECT ? 1 : 0 );

			}

			this.geometry.setHide( hide );

		} else {

			this.geometry.clearHide();

		}

	}

	getLegStations ( vertexIndex ) {

		const stations = this.ctx.survey.stations;
		const vertices = this.legVertices;

		const start = stations.getStation( vertices[ vertexIndex ] );
		const end = stations.getStation( vertices[ vertexIndex + 1 ] );

		return { start: start, end: end };

	}

}

export { Legs };