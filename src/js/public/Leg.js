class Leg {

	constructor ( s1, s2 ) {

		const s1Start = ( s1.shortestPathDistance() < s2.shortestPathDistance() );

		this.startStation = s1Start ? s1 : s2;
		this.endStation = s1Start ? s2 : s1;

	}

	start () {

		return this.startStation;

	}

	end () {

		return this.endStation;
	}

	length () {

		const start = this.startStation.coordinates();
		const end = this.endStation.coordinates();

		return start.distanceTo( end );

	}

}

export { Leg };