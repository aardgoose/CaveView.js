import { Station } from './Station';
import { Leg } from './Leg';

class PublicFactory {

	survey = null;
	stationCache = new WeakMap();


	constructor ( survey ) {

		this.survey = survey;

	}

	getStation ( station ) {

		let s = this.stationCache.get( station );

		if ( s == undefined ) {

			s = new Station( this, station );
			this.stationCache.set( station, s );

		}

		return s;

	}

	getLeg ( legs, leg ) {

		return new Leg( legs, leg, this.getStation( leg.start ), this.getStation( leg.end ) );

	}

}

export { PublicFactory };
