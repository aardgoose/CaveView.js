import { Vector3 } from '../Three';
import { CanvasPopup } from './CanvasPopup';

const __v0 = new Vector3();

class SegmentPopup extends CanvasPopup {

	constructor ( ctx, leg ) {

		super( ctx );

		const segment = leg.segment();

		this.addValue( 'leg_length', leg.length() );
		this.addValue( 'segment_length', segment.length() );
		this.addValue( 'direct_length', segment.directDistance() );

		// midpoint of line segment
		return this.finish( __v0.copy( leg.startStation.station ).add( leg.endStation.station ).divideScalar( 2 ) );

	}

}

export { SegmentPopup };