import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { LineSegments2 } from '../core/LineSegments2';
import { Line2Material } from '../materials/Line2Material';

class Grid extends LineSegments2 {

	constructor ( ctx ) {

		const geometry = new LineSegmentsGeometry();
		const survey = ctx.survey;
		const baseColor = ctx.cfg.themeColor( 'grid.base' );

		super( geometry, ctx.materials.getMaterial( Line2Material, { color: baseColor } ) );

		this.scale.set( 1, 1, 1 );
		this.type = 'CV.Grid';

		const box = ctx.survey.combinedLimits;

		const a = box.min.clone(); a.y = box.max.y;
		const b = box.max.clone();
		const c = box.min.clone(); c.x = box.max.x;
		const d = box.min.clone();

		/*
			Convert to original model CRS

			A-B
			| |
			D-C

		*/

		const A = survey.getGeographicalPosition( a );
		const B = survey.getGeographicalPosition( b );
		const C = survey.getGeographicalPosition( c );
		const D = survey.getGeographicalPosition( d );

		// approximate tranform as rotation and scale for small areas.

		const xRange = Math.min( C.x - D.x, B.x - A.x );
		const yRange = Math.min( A.y - D.y, B.y - C.y );

		const r = Math.log10( Math.max( xRange, yRange ) );
		const interval = Math.pow( 10, Math.round( r ) - 1 );

		const xScale = ( C.x - D.x ) / ( c.x - d.x );
		const yScale = ( A.y - D.y ) / ( a.y - d.y );

		const theta = Math.atan2( C.y - D.y, C.x - D.x );
		const cos = Math.cos( theta );

		const xOffset = ( interval - ( D.x % interval ) ) * cos / xScale;
		const yOffset = ( interval - ( D.y % interval ) ) * cos / yScale;

		const deltaX = interval * cos / xScale;
		const deltaY = interval * cos / yScale;

		// assume linear relationship between grids for simplicity
		const hGrad = ( c.x - d.x) * ( C.y - D.y ) / ( C.x - D.x );
		const vGrad = ( a.y - d.y) * ( A.x - D.x ) / ( A.y - D.y );

		const z = box.min.z;
		let i;

		const vertices = [];

		for ( i = d.x + xOffset; i < c.x; i += deltaX ) {

			vertices.push( i, d.y, z, i - vGrad, a.y, z );

		}

		for ( i = d.y + yOffset; i < a.y; i += deltaY ) {

			vertices.push( d.x,  i, z, c.x, i - hGrad, z );

		}

		geometry.setPositions( vertices );

	}

}

export { Grid };