import { CanvasPopup } from './CanvasPopup';

class SegmentPopup extends CanvasPopup {

	constructor ( ctx, leg, point) {

		super( ctx );

		this.addLine( 'test' );

		this.finish();

		this.position.copy( point );

	}

}

export { SegmentPopup };