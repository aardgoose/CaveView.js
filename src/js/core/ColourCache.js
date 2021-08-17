import { Colours } from './Colours';
import { Color } from '../Three';

// define colors to share THREE.color objects

function ColourCache () {

	const cache = [];

	function createColors ( scale ) {

		const cache = [];

		for ( let i = 0, l = scale.length; i < l; i++ ) {

			const c = scale[ i ];

			cache[ i ] = new Color( c[ 0 ] / 255, c[ 1 ] / 255, c[ 2 ] / 255 );

		}

		return cache;

	}

	this.getColors = function ( name ) {

		let entry = cache[ name ];

		if ( entry === undefined ) {

			const scale = Colours[ name ];

			if ( scale === undefined ) console.error( 'unknown colour scale requested ' + name );

			entry = createColors( scale );
			cache[ name ] = entry;

		}

		return entry;

	};

}

export { ColourCache };