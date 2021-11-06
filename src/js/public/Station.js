import { STATION_ENTRANCE, LEG_CAVE } from '../core/constants';

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

	depth () {

		const terrain = this.survey.terrain;
		return ( terrain ) ? this.station.z - terrain.getHeight( this.station ) : null;

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

	message () {

		return this.station.messageText;

	}

	isLinked () {

		return ( this.station.next !== null );

	}

	linkedStations () {

		const linked = [];
		const station = this.station;
		let next = station.next;

		while ( next && next !== station ) {

			linked.push( this.factory.getStation( next ) );
			next = next.next;

		}

		return linked;

	}

	forEachConnectedLeg ( callback ) {

		const survey = this.survey;
		const legs = this.legs;
		const factory = this.factory;

		survey.stations.resetPaths();

		legs.setShortestPaths( this.station, ( legInfo ) =>
			callback( factory.getLeg( legInfo ) )
		);

	}

}

export { Station };