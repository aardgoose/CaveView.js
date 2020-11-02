import { PopupMaterial } from '../materials/PopupMaterial';
import { Popup } from './Popup';
import { TextureLoader } from '../Three';

function ImagePopup( ctx, station, imageUrl, callback ) {

	Popup.call( this, ctx );

	this.type = 'ImagePopup';

	const texture = new TextureLoader().load( imageUrl, _textureLoaded );

	texture.onUpdate = function _dropCanvas ( texture ) { texture.image = null; };

	this.position.copy( station.p );

	const self = this;

	return this;

	function _textureLoaded( texture ) {

		self.material = new PopupMaterial( self.ctx.container, texture, 0 );
		self.material.needsUpdate = true;

		callback();

	}

}

ImagePopup.prototype = Object.create( Popup.prototype );

export { ImagePopup };