import { Station } from './Station';
import { Leg } from './Leg';
import { Segment } from './Segment';

class PublicFactory {

	survey = null;
	stationCache = new WeakMap();
	segmentCache = [];
	legCache = new WeakMap();

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

	getLeg( legInfo ) {

		let leg = this.legCache.get( legInfo );

		if ( leg === undefined ) {

			leg = new Leg( this, legInfo, this.getStation( legInfo.start ), this.getStation( legInfo.end ) );
			this.legCache.set( legInfo, leg );

		}

		return leg;

	}

	getSegment( segmentIndex ) {

		const survey = this.survey;

		let segment = this.segmentCache[ segmentIndex ];

		if ( segment === undefined ) {

			const segmentInfo = survey.segments.getSegmentInfo( segmentIndex );

			segment = Segment( segmentInfo, this.getStation( segmentInfo.startStation ), this.getStation( segmentInfo.endStation ) );
			this.segmentCache[ segmentIndex ] = segment;

		}

		return segment;

	}

}

export { PublicFactory };
