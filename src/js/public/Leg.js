class Leg {

	constructor ( legs, leg, s1, s2 ) {

		const s1Start = ( s1.shortestPathDistance() < s2.shortestPathDistance() );

		this.length = leg.length;
		this.index = leg.index;
		this.legs = legs;
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

		return this.length;

	}

	color ( color = false ) {

		this.legs.setLegColor( this.index, color );

	}

}

export { Leg };