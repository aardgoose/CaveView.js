import { Float32BufferAttribute } from '../Three';
import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { LineSegments2 } from '../core/LineSegments2';
import { STATION_XSECT } from '../core/constants';

class Legs extends LineSegments2 {

	constructor ( ctx ) {

		const geometry = new LineSegmentsGeometry();

		super( geometry, ctx.materials.getSurveyLineMaterial( 'basic' ) );

		this.ctx = ctx;
		this.colourCache = ctx.materials.colourCache;
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

		const vertices = this.legVertices;
		const l = vertices.length;

		const n = l / 2;
		const legLengths = new Array( n );

		let s1 = 0, s2 = 0;
		let min = Infinity;
		let max = -Infinity;

		for ( let i = 0; i < l; i += 2 ) {

			const vertex1 = vertices[ i ];
			const vertex2 = vertices[ i + 1 ];

			const legLength = vertex1.correctedDistanceTo( vertex2 );

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

	getLegStations ( vertexIndex ) {

		const vertices = this.legVertices;

		vertexIndex *= 2;

		const start = vertices[ vertexIndex ];
		const end = vertices[ vertexIndex + 1 ];

		return { start: start, end: end };

	}

	setLegColor( leg, color1, color2 = null ) {

		const c1 = this.colourCache.getColour( color1 );
		const c2 = ( ! color2 ) ? c1: this.colourCache.getColour( color2 );

		const colours = this.colors.array;

		leg *= 3;
		c1.toArray( colours, leg );
		c2.toArray( colours, leg + 3 );

		this.geometry.getAttribute( 'instanceColorStart' ).needsUpdate = true;
		this.geometry.getAttribute( 'instanceColorEnd' ).needsUpdate = true;

	}

}

export { Legs };