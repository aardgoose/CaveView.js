class Segments {

	constructor () {

		const segmentMap = new Map(); // maps segments of survey between ends of passages and junctions.
		const segmentToInfo = [];

		this.addSegment = function ( segmentInfo ) {

			segmentMap.set( segmentInfo.startStation.id + ':' + segmentInfo.endStation.id, segmentInfo );
			segmentToInfo[ segmentInfo.segment ] = segmentInfo;

		};

		this.getSegmentInfo = function ( index ) {

			return segmentToInfo[ index ];

		};

		this.getMap = function () {

			return segmentMap;

		};

	}

}

export { Segments };