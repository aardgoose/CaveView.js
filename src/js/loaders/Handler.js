import { Cfg } from '../core/lib';
import proj4 from 'proj4';

function Handler() {}

Handler.prototype.setCRS = function ( sourceCRS ) {

	if ( sourceCRS !== null ) {

		// work around lack of +init string support in proj4js

		const matches = sourceCRS.match( /\+init=(.*)\s/ );

		if ( matches && matches.length === 2 ) {

			switch ( matches[ 1 ] ) {

			case 'epsg:27700' :

				sourceCRS = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs';

				break;

			default:

				throw new Error( 'Unsupported projection' );

			}

		}

	}

	const displayCRS = Cfg.value( 'displayCRS', 'EPSG:3857' );

	if ( sourceCRS === null ) sourceCRS = Cfg.value( 'defaultCRS', null );

	// FIXME use NAD grid corrections OSTM15 etc ( UK Centric )
	if ( sourceCRS !== null ) {

		this.sourceCRS = sourceCRS;

		if ( displayCRS === 'ORIGINAL' ) {

			this.displayCRS = 'ORIGINAL';

		} else {

			console.log( 'Reprojecting from', sourceCRS, 'to', this.targetCRS );

			this.projection = proj4( this.sourceCRS, this.targetCRS );
			this.displayCRS = this.targetCRS;

		}

	}

};


export { Handler };

// EOF