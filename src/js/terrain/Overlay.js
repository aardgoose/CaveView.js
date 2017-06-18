
import {
	TextureLoader,
	MeshLambertMaterial,
	NearestFilter
} from '../../../../three.js/src/Three';


function Overlay ( getUrl ) {

	this.getUrl = getUrl;

}

Overlay.prototype.getTile = function ( x, y, z, opacity, overlayLoaded ) {

	var url = this.getUrl( x, y, z );

	new TextureLoader().setCrossOrigin( 'anonymous' ).load( url, _textureLoaded );

	return;

	function _textureLoaded( texture ) {

		var material = new MeshLambertMaterial( { transparent: true, opacity: opacity, color: 0xffffff } );

		texture.magFilter = NearestFilter;

		material.map = texture;
		material.needsUpdate = true;

		overlayLoaded( material );

	}

};

Overlay.prototype.contructor = Overlay;

export { Overlay };
