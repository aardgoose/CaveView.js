import { STATION_ENTRANCE } from '../core/constants';

class Station {

	constructor ( survey, station ) {

		this.station = station;
		this.survey = survey;

	}

	coordinates () {

		return this.survey.getGeographicalPosition( this.station.p );

	}

	id() {

		return this.station.id;

	}

	isEntrance() {

		return this.station.type & STATION_ENTRANCE == STATION_ENTRANCE;

	}

	name() {

		return this.station.getPath();

	}

	adjacentStationIds() {

		return this.survey.topology.getAdjacentStations( this.station ).slice();

	}

	shortestPathDistance() {

		return this.station.p.shortestPath;

	}

	forEachConnectedLeg( callback ) {

		const survey = this.survey;

		survey.topology.shortestPathSearch( this.station, ( s1, s2, l ) => {
			callback( {
				v1: new Station( survey, s1 ),
				v2: new Station( survey, s2 ),
				length: l
			} );
		} );

	}

}

export { Station };