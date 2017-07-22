
import {
	TextureLoader,
	MeshLambertMaterial,
	NearestFilter
} from '../../../../three.js/src/Three';


function Overlay ( overlayProvider, container ) {

	this.provider = overlayProvider;
	this.container = container;

	var attribution = overlayProvider.getAttribution();

	if ( attribution ) {

		attribution.classList.add( 'overlay-branding' );
		this.attribution = attribution;

	}

}

Overlay.prototype.showAttribution = function () {

	var attribution = this.attribution;

	if ( attribution !== undefined ) this.container.appendChild( attribution );

};

Overlay.prototype.hideAttribution = function () {

	var attribution = this.attribution;
	var parent = attribution.parentNode;

	if ( parent !== null ) parent.removeChild( attribution );

};

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
