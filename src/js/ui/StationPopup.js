import { CanvasPopup } from './CanvasPopup';

class StationPopup extends CanvasPopup {

	constructor ( ctx, pStation, survey, formatter, showDistance, warnings ) {

		super( ctx );

		const position = pStation.coordinates();
		const depth = pStation.depth();

		let lines = null;

		this.addLine( this.formatName( pStation.name() ) );

		if ( pStation.isLinked() ) {

			pStation.linkedStations().forEach( station => {

				this.addLine( ` (${this.formatName( station.name() )})` );

			} );

		}

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

				this.addLine( 'x: ' + Math.round( position.x ) + '\u202fm, y: ' + Math.round( position.y ) + '\u202fm' ).addValue( 'z', position.z );

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