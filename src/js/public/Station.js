import { STATION_ENTRANCE, LEG_CAVE } from '../core/constants';
import { Leg } from './Leg';

class Station {

	constructor ( factory, station ) {

		const survey = factory.survey;
		this.survey = survey;
		this.station = station;
		this.legs = survey.getFeature( LEG_CAVE );
		this.factory = factory;
	}

	id () {

		return this.station.id;

	}

	name () {

		return this.station.getPath();

	}

	coordinates () {

		return this.survey.getGeographicalPosition( this.station );

	}

	connectionCount () {

		return this.station.connections;

	}

	isEntrance () {

		return  ( this.station.type & STATION_ENTRANCE  ) === STATION_ENTRANCE;

	}

	adjacentStationIds () {

		return this.legs.getAdjacentStations( this.station ).slice();

	}

	shortestPathDistance () {

		return this.station.shortestPath;

	}

	forEachConnectedLeg ( callback ) {

		const survey = this.survey;
		const legs = this.legs;
		const factory = this.factory;

		legs.setShortestPaths( survey.stations, this.station, ( leg ) =>
			callback( new Leg( survey, leg, factory.getStation( leg.start ), factory.getStation( leg.end ) ) )
		);

	}

}

export { Station };