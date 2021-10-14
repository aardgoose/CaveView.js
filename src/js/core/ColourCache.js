import { Colours } from './Colours';
import { Color } from '../Three';

// define colors to share THREE.color objects across multiple instances

class ColourCache {

	static setCache = [];
	static cache = [];

	constructor () {}

	getColorSet ( name ) {

		let entry = ColourCache.setCache[ name ];

		if ( entry === undefined ) {

			const scale = Colours[ name ];

			if ( scale === undefined ) console.error( 'unknown colour scale requested ' + name );

			entry = scale.map( c => new Color( c[ 0 ] / 255, c[ 1 ] / 255, c[ 2 ] / 255 ) );
			ColourCache.setCache[ name ] = entry;

		}

		return entry;

	}

	getColour ( name ) {

		let entry = ColourCache.cache[ name ];

		if ( entry === undefined ) {

			entry = new Color( name );
			ColourCache.cache[ name ] = entry;

		}

		return entry;

	}

}

export { ColourCache };