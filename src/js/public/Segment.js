class Segment {

	constructor ( segmentInfo, start, end ) {

		this.segmentLength = segmentInfo.length;
		this.startStation = start;
		this.endStation = end;

	}

	length () {

		return this.segmentLength;

	}

	directDistance () {

		return this.startStation.distanceTo( this.endStation );

	}

}


export { Segment };