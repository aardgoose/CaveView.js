import { CanvasPopup } from './CanvasPopup';

class StationPopup extends CanvasPopup {

	constructor ( ctx, pStation, survey, formatter, showDistance, warnings ) {

		super( ctx );

		const position = pStation.coordinates();
		const depth = pStation.depth();

		let name = pStation.name();
		let long = false;
		let lines = null;

		// reduce name length if too long

		while ( name.length > 20 ) {

			const tmp = name.split( '.' );
			tmp.shift();

			name = tmp.join( '.' );
			long = true;

		}

		if ( long ) name = '...' + name;

		this.addLine( name );

		let distance;

		if ( showDistance ) {

			distance = pStation.shortestPathDistance();
			distance = distance !== Infinity ? Math.round( distance ) : 'unconnected';

		} else {

			distance = null;

		}

		if ( warnings ) {

			const message = pStation.message();

			if ( message !== undefined ) this.addLine( message );

		} else {

			if ( formatter !== undefined ) {

				lines = formatter( survey.CRS, position, depth, distance );

			}

			if ( lines !== null ) {

				for ( let i = 0; i < lines.length; i++ ) {

					this.addLine( lines[ i ] );

				}

			} else {

				this.addLine( 'x: ' + Math.round( position.x ) + ' m, y: ' + Math.round( position.y ) + ' m' ).addLine( 'z: ' + Math.round( position.z ) + ' m' );

				if ( depth !== null ) this.addValue( 'depth_from_surface', + depth );

				if ( showDistance ) {

					this.addValue( 'distance', distance );

				}

			}

		}

		this.finish( pStation.station );

	}

}

export { StationPopup };