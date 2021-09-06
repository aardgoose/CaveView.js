import { Colours } from './Colours';
import { Color } from '../Three';

// define colors to share THREE.color objects

class ColourCache {

	constructor () {

		const cache = [];

		this.getColors = function ( name ) {

			let entry = cache[ name ];

			if ( entry === undefined ) {

				const scale = Colours[ name ];

				if ( scale === undefined ) console.error( 'unknown colour scale requested ' + name );

				entry = scale.map( c => new Color( c[ 0 ] / 255, c[ 1 ] / 255, c[ 2 ] / 255 ) );
				cache[ name ] = entry;

			}

			return entry;

		};

	}

}

export { ColourCache };