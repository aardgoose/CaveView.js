import { CanvasPopup } from './CanvasPopup';

class SegmentPopup extends CanvasPopup {

	constructor ( ctx, leg, point ) {

		super( ctx );

		const segment = leg.segment();

		this.addValue( 'leg_length', leg.length() );
		this.addValue( 'segment_length', segment.length() );
		this.addValue( 'direct_length', segment.directDistance() );

		this.finish( point );

	}

}

export { SegmentPopup };