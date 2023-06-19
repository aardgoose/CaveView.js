import { Vector3 } from '../Three';
import { CanvasPopup } from './CanvasPopup';
import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { LineSegments2 } from '../core/LineSegments2';
import { Line2Material } from '../materials/Line2Material';

const __v1 = new Vector3();
const __v2 = new Vector3();

class StationDistancePopup extends CanvasPopup {

	constructor ( ctx, survey, startStation, endStation ) {

		super( ctx, 20000 );

		this.addLine( this.formatName( startStation.getPath() ) );
		this.addLine( this.formatName( endStation.getPath() ) );

		const p1 = survey.getGeographicalPosition( startStation, __v1 );
		const p2 = survey.getGeographicalPosition( endStation, __v2 );

		p1.sub( p2 );

		this.addValue( ' dx', Math.abs( p1.x ) );
		this.addValue( ' dy', Math.abs( p1.y ) );
		this.addValue( ' dz', Math.abs( p1.z ) );

		this.addValue( 'distance', p1.length() );

		this.finish( endStation );

		const geometry = new LineSegmentsGeometry();

		geometry.setPositions( [
			startStation.x, startStation.y, startStation.z,
			endStation.x, endStation.y, endStation.z
		] );

		this.line = new LineSegments2( geometry, ctx.materials.getMaterial( Line2Material, { color: 'white' } ) );
		this.station = startStation;

		survey.addStatic( this.line );

	}

	close () {

		super.close();
		this.line.removeFromParent();

	}

}

export { StationDistancePopup };