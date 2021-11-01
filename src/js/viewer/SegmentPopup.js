import { CanvasPopup } from './CanvasPopup';

class SegmentPopup extends CanvasPopup {

	constructor ( ctx, leg, point, survey ) {

		super( ctx );

		const segment = survey.segments.getSegmentInfo( leg.segment );

		const d = survey.getGeographicalDistance( segment.startStation, segment.endStation );

		this.addValue( 'leg_length', leg.length );
		this.addValue( 'segment_length', segment.length );
		this.addValue( 'direct_length', d );

		this.finish( point );

	}

}

export { SegmentPopup };