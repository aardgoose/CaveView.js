class Segment {

	constructor ( segmentInfo, start, end ) {

		this.segmentLength = segmentInfo.length;
		this.startStation = start;
		this.endStation = end;
		this.direct = null;

	}

	length () {

		return this.segmentLength;

	}

	directDistance () {

		if ( this.direct === null ) {

			this.direct =  this.startStation.coordinates().distanceTo( this.endStation.coordinates() );

		}

		return this.direct;

	}

}

export { Segment };