import { LEG_CAVE } from '../core/constants';

class Leg {

	constructor ( survey, leg, s1, s2 ) {

		const s1Start = ( s1.shortestPathDistance() < s2.shortestPathDistance() );

		this.legLength = leg.length;
		this.index = leg.index;
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

}

export { Leg };