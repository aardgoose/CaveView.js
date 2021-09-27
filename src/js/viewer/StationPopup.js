import { CanvasPopup } from './CanvasPopup';

class StationPopup extends CanvasPopup {

	constructor ( ctx, station, survey, depth, formatter, showDistance, warnings ) {

		super( ctx );

		const position = survey.getGeographicalPosition( station );

		let name = station.getPath();
		let long = false;
		let lines = null;

		// reduce name length if too long

		while ( name.length > 20 ) {

			const tmp = name.split( '.' );
			tmp.shift();

			name = tmp.join( '.' );
			long = true;

		}

		let distance;

		if ( showDistance ) {

			distance = station.shortestPath !== Infinity ? Math.round( station.shortestPath ) : 'unconnected';

		} else {

			distance = null;

		}

		if ( long ) name = '...' + name;

		this.addLine( name );

		if ( warnings && station.messageText !== undefined ) {

			this.addLine( station.messageText );

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

				if ( depth !== null ) this.addLine( 'depth from surface: ' + Math.round( depth ) + ' m' );

				if ( showDistance ) {

					this.addLine( 'distance: ' + distance + '\u202fm' );

				}

			}

		}

		this.finish();

		this.position.copy( station );

	}

}

export { StationPopup };