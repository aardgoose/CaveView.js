import { LEG_CAVE } from '../core/constants';

class Leg {

	constructor ( factory, legInfo, s1, s2 ) {

		const s1Start = ( s1.shortestPathDistance() < s2.shortestPathDistance() );
		const survey = factory.survey;

		this.factory = factory;
		this.legLength = legInfo.length;
		this.index = legInfo.index;
		this.segmentId = legInfo.segment;
		this.startStation = s1Start ? s1 : s2;
		this.endStation = s1Start ? s2 : s1;
		this.legs = survey.getFeature( LEG_CAVE );

	}

	start () {

		return this.startStation;

	}

	end () {

		return this.endStation;
	}

	length () {

		return this.legLength;

	}

	color ( color = false ) {

		this.legs.setLegColor( this.index * 2, color );

	}

	segment() {

		return this.factory.getSegment( this.segmentId );

	}

}

export { Leg };