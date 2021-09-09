import { STATION_ENTRANCE } from '../core/constants';
import { Leg } from './Leg';

class Station {

	constructor ( survey, station ) {

		this.station = station;
		this.survey = survey;

	}

	id() {

		return this.station.id;

	}

	name() {

		return this.station.getPath();

	}

	coordinates () {

		return this.survey.getGeographicalPosition( this.station );

	}


	connectionCount() {

		return this.station.connections;

	}

	isEntrance() {

		return  ( this.station.type & STATION_ENTRANCE  ) === STATION_ENTRANCE;

	}

	adjacentStationIds() {

		return this.survey.topology.getAdjacentStations( this.station ).slice();

	}

	shortestPathDistance() {

		return this.station.shortestPath;

	}

	forEachConnectedLeg( callback ) {

		const survey = this.survey;

		survey.topology.shortestPathSearch( this.station, ( s1, s2 ) =>
			callback( new Leg( new Station( survey, s1 ), new Station( survey, s2 ) ) )
		);

	}

}

export { Station };