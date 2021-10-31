import { CanvasPopup } from './CanvasPopup';

class SegmentPopup extends CanvasPopup {

	constructor ( ctx, leg, point, survey ) {

		super( ctx );

		const segment = survey.segments.getSegmentInfo( leg.segment );

		const start = survey.getGeographicalPosition( segment.startStation );
		const end = survey.getGeographicalPosition( segment.endStation );

		this.addLine( 'Leg length: ' + leg.length.toFixed( 2 ) + '\u202fm' );
		this.addLine( 'Segment length: ' + segment.length.toFixed( 2 ) + '\u202fm' );
		this.addLine( 'Direct length: ' + start.distanceTo( end ).toFixed( 2 ) + '\u202fm' );

		this.finish();

		this.position.copy( point );

	}

}

export { SegmentPopup };