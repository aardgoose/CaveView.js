import { STATION_ENTRANCE, LEG_CAVE } from '../core/constants';
import { Leg } from './Leg';

class Station {

	static cache = new WeakMap();
	static survey = null;
	static legs = null;

	static get( station ) {

		let s = Station.cache.get( station );

		if ( s == undefined ) {

			s = new Station( station );
			Station.cache.set( station, s );

		}

		return s;

	}

	static initCache ( survey ) {

		Station.cache = new WeakMap();
		Station.survey = survey;
		Station.legs = survey.features.get( LEG_CAVE );

	}

	constructor ( station ) {

		this.station = station;

	}

	id () {

		return this.station.id;

	}

	name () {

		return this.station.getPath();

	}

	coordinates () {

		return Station.survey.getGeographicalPosition( this.station );

	}


	connectionCount () {

		return this.station.connections;

	}

	isEntrance () {

		return  ( this.station.type & STATION_ENTRANCE  ) === STATION_ENTRANCE;

	}

	adjacentStationIds () {

		return Station.legs.getAdjacentStations( this.station ).slice();

	}

	shortestPathDistance () {

		return this.station.shortestPath;

	}

	forEachConnectedLeg ( callback ) {

		const survey = Station.survey;

		Station.legs.setShortestPaths( survey.stations, this.station, ( leg, s1, s2 ) =>
			callback( new Leg( Station.legs, leg, Station.get( s1 ), Station.get( s2 ) ) )
		);

	}

}

export { Station };