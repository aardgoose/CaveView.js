import { Vector3 } from '../Three';
import { CanvasPopup } from './CanvasPopup';
import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { LineSegments2 } from '../core/LineSegments2';

const __v1 = new Vector3();
const __v2 = new Vector3();

class StationDistancePopup extends CanvasPopup {

	constructor ( ctx, survey, startStation, endStation ) {

		super( ctx, 20000 );

		this.addLine( startStation.getPath() );
		this.addLine( endStation.getPath() );

		const p1 = survey.getGeographicalPosition( startStation, __v1 );
		const p2 = survey.getGeographicalPosition( endStation, __v2 );

		this.addValue( 'dX', Math.abs( p1.x - p2.x ) );
		this.addValue( 'dY', Math.abs( p1.y - p2.y ) );
		this.addValue( 'dZ', Math.abs( p1.z - p2.z ) );
		this.addValue( 'distance', p1.distanceTo( p2 ) );

		this.finish( endStation );

		const geometry = new LineSegmentsGeometry();

		geometry.setPositions( [
			startStation.x, startStation.y, startStation.z,
			endStation.x, endStation.y, endStation.z
		] );

		this.line = new LineSegments2( geometry, ctx.materials.getLine2Material() );
		survey.addStatic( this.line );

	}

	close () {

		super.close();
		this.line.removeFromParent();

	}

}

export { StationDistancePopup };