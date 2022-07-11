import { TextureLoader } from '../Three';
import { Popup } from './Popup';
import { PopupMaterial } from '../materials/PopupMaterial';

class ImagePopup extends Popup {

	constructor ( ctx, station, imageUrl, callback ) {

		super( ctx );

		this.type = 'ImagePopup';

		const texture = new TextureLoader().load( imageUrl, ( texture ) => {

			this.material = new PopupMaterial( ctx.container, texture, 0 );
			this.material.needsUpdate = true;

			callback();

		} );

		texture.onUpdate = function _dropCanvas ( texture ) { texture.image = null; };

		this.position.copy( station );

	}

}

export { ImagePopup };