import { DataTexture, LinearFilter, RGBAFormat, TextureLoader, UnsignedByteType } from '../Three';
import { Colours } from './Colours';

// define colors to share THREE.color objects

class TextureCache {

	constructor () {

		const cache = [];

		function createTexture ( scale ) {

			const n = [];

			// add alpha values
			scale.forEach( colour => { n.push( ...colour, 255 ); } );

			const data = Uint8Array.from( n );
			const texture = new DataTexture( data, scale.length, 1, RGBAFormat, UnsignedByteType );

			texture.minFilter = LinearFilter;
			texture.magFilter = LinearFilter;

			texture.needsUpdate = true;

			return texture;

		}

		this.getTexture = function ( name ) {

			let entry = cache[ name ];

			if ( entry === undefined ) {

				if ( name === 'disc' ) {

					entry = new TextureLoader().load( "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg id='a' width='32mm' height='32mm' version='1.1' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' %3E%3Ccircle id='d' cx='16' cy='16' r='14' color='%23000000' fill='%23fff' fill-rule='evenodd' stroke-width='0'/%3E%3C/svg%3E%0A" );

				} else if ( name === 'disc-outlined' ) {

					entry = new TextureLoader().load( "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg id='a' width='32mm' height='32mm' version='1.1' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' %3E%3Ccircle id='d' cx='16' cy='16' r='14' color='%23000000' fill='%23fff' fill-rule='evenodd' stroke-width='1' stroke='%23000'/%3E%3C/svg%3E%0A" );

				} else {

					const scale = Colours[ name ];

					if ( scale === undefined ) console.error( 'unknown colour scale requested ' + name );

					entry = createTexture( scale );

				}

				cache[ name ] = entry;

			}

			return entry;

		};

	}

}

export { TextureCache };