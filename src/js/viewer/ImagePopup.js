import { PopupMaterial } from '../materials/PopupMaterial';
import { Popup } from './Popup';
import { TextureLoader } from '../Three';

class ImagePopup extends Popup {

	constructor ( ctx, station, imageUrl, callback ) {

		super( ctx );

		this.type = 'ImagePopup';

		const texture = new TextureLoader().load( imageUrl, _textureLoaded );

		texture.onUpdate = function _dropCanvas ( texture ) { texture.image = null; };

		this.position.copy( station );

		const self = this;

		function _textureLoaded( texture ) {

			self.material = new PopupMaterial( self.ctx.container, texture, 0 );
			self.material.needsUpdate = true;

			callback();

		}

	}

}

export { ImagePopup };