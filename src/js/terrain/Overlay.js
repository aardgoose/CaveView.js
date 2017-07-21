
import {
	TextureLoader,
	MeshLambertMaterial,
	NearestFilter
} from '../../../../three.js/src/Three';


function Overlay ( overlayProvider ) {

	this.provider = overlayProvider;

}

Overlay.prototype.getAttribution = function () {

	return this.provider.getAttribution();

}

Overlay.prototype.getTile = function ( x, y, z, opacity, overlayLoaded ) {

	var url = this.provider.getUrl( x, y, z );

	if ( url === null ) return;

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

Overlay.prototype.constructor = Overlay;

export { Overlay };
