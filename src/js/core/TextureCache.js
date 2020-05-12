import { Colours } from './Colours';
import { DataTexture, RGBFormat, UnsignedByteType, LinearFilter } from '../Three';

// define colors to share THREE.color objects

function TextureCache ( ) {

	const cache = [];

	function createTexture ( scale ) {

		const l = scale.length;
		const data = new Uint8Array( l * 3 );

		var offset = 0;

		for ( var i = l; i; ) {

			const c = scale[ --i ];

			data[ offset++ ] = c[ 0 ];
			data[ offset++ ] = c[ 1 ];
			data[ offset++ ] = c[ 2 ];

		}

		const texture = new DataTexture( data, l, 1, RGBFormat, UnsignedByteType );

		texture.minFilter = LinearFilter;
		texture.magFilter = LinearFilter;

		texture.needsUpdate = true;

		return texture;

	}

	this.getTexture = function ( name ) {

		var entry = cache[ name ];

		if ( entry === undefined ) {

			const scale = Colours[ name ];

			if ( scale === undefined ) console.error( 'unknown colour scale requested ' + name );

			entry = createTexture( scale );
			cache[ name ] = entry;

		}

		return entry;

	};

}

export { TextureCache };