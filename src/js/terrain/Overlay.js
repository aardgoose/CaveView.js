
import {
	TextureLoader,
	MeshLambertMaterial,
	NearestFilter
} from '../../../../three.js/src/Three';


function Overlay ( x, y, z, opacity, overlayLoaded, url ) {

	new TextureLoader().setCrossOrigin( 'anonymous' ).load( url, _textureLoaded );

	return;

	function _textureLoaded( texture ) {

		var material = new MeshLambertMaterial( { transparent: true, opacity: opacity, color: 0xffffff } );

		texture.magFilter = NearestFilter;

		material.map = texture;
		material.needsUpdate = true;

		overlayLoaded( material );

	}

}

Overlay.prototype.contructor = Overlay;

export { Overlay };
