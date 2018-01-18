
import {
	TextureLoader,
	MeshLambertMaterial
} from '../../../../three.js/src/Three';

// FIXME fix lifecycle of materials and textures - ensure disposal/caching as required
// GPU resource leak etc.

function Overlay ( overlayProvider, container ) {

	this.provider = overlayProvider;
	this.container = container;

	const attribution = overlayProvider.getAttribution();

	if ( attribution ) {

		attribution.classList.add( 'overlay-branding' );
		this.attribution = attribution;

	}

	this.materialCache = {};

}

Overlay.prototype.showAttribution = function () {

	const attribution = this.attribution;

	if ( attribution !== undefined ) this.container.appendChild( attribution );

};

Overlay.prototype.hideAttribution = function () {

	const attribution = this.attribution;
	const parent = attribution.parentNode;

	if ( parent !== null ) parent.removeChild( attribution );

};

Overlay.prototype.getTile = function ( x, y, z, opacity, overlayLoaded ) {

	const self = this;
	const key = x + ':' + y + ':' + z;

	var material = this.materialCache[ key ];

	if ( material !== undefined ) {

		overlayLoaded( material );

		return;

	}

	const url = this.provider.getUrl( x, y, z );

	if ( url === null ) return;

	new TextureLoader().setCrossOrigin( 'anonymous' ).load( url, _textureLoaded );

	return;

	function _textureLoaded( texture ) {

		var material = new MeshLambertMaterial( { transparent: true, opacity: opacity, color: 0xffffff } );

		material.map = texture;
		material.needsUpdate = true;

		self.materialCache[ key ] = material;

		overlayLoaded( material );

	}

};

Overlay.prototype.flushCache = function () {

	const materialCache = this.materialCache;

	for ( var name in materialCache ) {

		let material = materialCache[ name ];

		material.map.dispose();
		material.dispose();

	}

	this.materialCache = {};

};

Overlay.prototype.constructor = Overlay;

export { Overlay };
