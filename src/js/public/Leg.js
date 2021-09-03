class Leg {

	constructor ( s1, s2, length ) {

		const s1Start = ( s1.shortestPathDistance() < s2.shortestPathDistance() );

		this.startStation = s1Start ? s1 : s2;
		this.endStation = s1Start ? s2 : s1;

		this.legLength = length;

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

}

export { Leg };