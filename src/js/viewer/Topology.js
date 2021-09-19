class Topology {

	constructor ( stations, legsObject ) {

		if ( stations.length === 0 || ! legsObject ) return;

		this.stations = stations;
		this.legsObject = legsObject;

		this.vertexPairToSegment = []; // maps vertex index to segment membership
		this.segmentMap = new Map(); // maps segments of survey between ends of passages and junctions.
		this.segmentToInfo = {};

		this.maxDistance = 0;
		this.zeroStation = null;

		// determine segments between junctions and entrances/passage ends and create mapping array.

		const legs = legsObject.legVertices;
		const segmentMap = this.segmentMap;
		const vertexPairToSegment = this.vertexPairToSegment;
		const segmentToInfo = this.segmentToInfo;
		const l = legs.length;

		let station;
		let newSegment = true;
		let segment = 0;
		let segmentInfo;

		for ( let i = 0; i < l; i = i + 2 ) {

			const v1 = legs[ i ];
			const v2 = legs[ i + 1 ];

			vertexPairToSegment.push( segment );

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
				};

				newSegment = false;

			}

			station = v2;

			if ( station !== undefined ) station.legs.push( i );

			if ( station && ( station.connections > 2 || ( i + 2 < l && ! station.equals( legs[ i + 2 ] ) ) ) ) {

				// we have found a junction or a passage end
				segmentInfo.endStation = station;

				segmentMap.set( segmentInfo.startStation.id + ':' + station.id, segmentInfo );
				segmentToInfo[ segment ] = segmentInfo;

				station.linkedSegments.push( segment );

				segment++;

				newSegment = true;

			}

		}

		if ( ! newSegment ) {

			segmentInfo.endStation = station;

			segmentMap.set( segmentInfo.startStation.id + ':' + station.id, segmentInfo );

			station.linkedSegments.push( segment );

		}

		return this;
	}

	vertexSegment ( index ) {

		return this.vertexPairToSegment[ index / 2 ];

	}

	shortestPathSearch ( station, legCallback = null ) {

		const legsSeen = [];
		// queue of stations searched.
		const queue = [ station ];

		const legsObject = this.legsObject;
		const legs = legsObject.legVertices;
		const stations = this.stations;

		stations.resetDistances();

		let maxDistance = 0;

		station.shortestPath = 0;

		while ( queue.length > 0 ) {

			const station = queue.shift();
			const stationLegs = station.legs;

			if ( ! stationLegs ) continue;

			const currentDistance = station.shortestPath;

			maxDistance = Math.max( maxDistance, currentDistance );

			// find stations connected to this station
			for ( let i = 0; i < stationLegs.length; i++ ) {

				const leg = stationLegs[ i ];

				const v1 = legs[ leg ];

				const nextStation = ( v1 === station ) ? legs[ leg + 1 ] : v1;
				const nextLength = legsObject.legLengths[ leg / 2 ];

				if ( legCallback !== null && ! legsSeen[ leg ] ) {

					legCallback( leg, station, nextStation );
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

		this.zeroStation = station;
		this.maxDistance = maxDistance;

	}

	getShortestPath ( startStation ) {

		const zeroStation = this.zeroStation;
		const path = new Set();

		if (
			zeroStation === null ||
			startStation.shortestPath === Infinity ||
			startStation === zeroStation ||
			startStation.shortestPath === 0
		) return path;

		const legsObject = this.legsObject;
		const legs = legsObject.legVertices;

		let nextStation = startStation;
		let testNext = true;

		// for each station find station with shortest distance to zeroStation

		while ( testNext ) {

			const stationLegs = nextStation.legs;
			const l = stationLegs.length;

			for ( let i = 0; i < l; i++ ) {

				const leg = stationLegs[ i ];
				const v1 = legs[ leg ];

				const testStation = ( v1 === nextStation ) ? legs[ leg + 1 ] : v1;

				if ( testStation.shortestPath < nextStation.shortestPath ) {

					nextStation = testStation;
					path.add( leg );

					if ( nextStation === zeroStation ) testNext = false;

				}

			}

		}

		return path;

	}

	getAdjacentStations ( station ) {

		const legs = this.legsObject.legVertices;
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

}

export { Topology };