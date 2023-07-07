import { DataTexture, Texture, LinearFilter, RGBAFormat, TextureLoader, UnsignedByteType } from '../Three';
import { Colours } from './Colours';

// define colors to share THREE.color objects

class TextureCache {

	constructor () {

		const cache = {};

		preloadSVGTexture( 'disc', "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg id='a' width='32mm' height='32mm' version='1.1' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' %3E%3Ccircle id='d' cx='16' cy='16' r='14' color='%23000000' fill='%23fff' fill-rule='evenodd' stroke-width='0'/%3E%3C/svg%3E%0A" ); // eslint-disable-line
		preloadSVGTexture( 'disc-outlined', "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg id='a' width='32mm' height='32mm' version='1.1' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' %3E%3Ccircle id='d' cx='16' cy='16' r='14' color='%23000000' fill='%23fff' fill-rule='evenodd' stroke-width='1' stroke='%23000'/%3E%3C/svg%3E%0A" ); // eslint-disable-line
		preloadSVGTexture( 'pointer', "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' width='36px' height='36px'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M20.94 11c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z'/%3E%3C/svg%3E" );  // eslint-disable-line

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

		function preloadSVGTexture( name, svg ) {

			const i = new Image();

			i.src = svg;

			i.decode().then( () => createImageBitmap( i ) ).then( imageBitmap => {

				const texture = new Texture( imageBitmap );

				texture.flipY = false;
				texture.needsUpdate = true;

				cache[ name ] = texture;

			} );

		}

		this.getTexture = function ( name ) {

			let entry = cache[ name ];

			if ( entry === undefined ) {

				const scale = Colours[ name ];

				if ( scale === undefined ) console.error( 'unknown colour scale requested ' + name );

				entry = createTexture( scale );

				cache[ name ] = entry;

			}

			return entry;

		};

	}

}

export { TextureCache };