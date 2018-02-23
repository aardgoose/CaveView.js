
import {
	TextureLoader,
	MeshLambertMaterial
} from '../Three';

import { Cfg } from '../core/lib';

// FIXME fix lifecycle of materials and textures - ensure disposal/caching as required
// GPU resource leak etc.

const missingMaterial = new MeshLambertMaterial( { transparent: true, opacity: 0.5, color: 0xffffff } );

function Overlay ( overlayProvider, container ) {

	this.provider = overlayProvider;
	this.container = container;

	const attribution = overlayProvider.getAttribution();

	if ( attribution ) {

		attribution.classList.add( 'overlay-branding' );
		this.attribution = attribution;

	}

	this.materialCache = {};
	this.missing = new Set();

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

	const material = this.materialCache[ key ];

	if ( material !== undefined ) {

		overlayLoaded( material );

		return;

	}

	const url = this.provider.getUrl( x, y, z );

	if ( url === null || this.missing.has( url ) ) {

		overlayLoaded( missingMaterial );

		return;

	}

	new TextureLoader().setCrossOrigin( 'anonymous' ).load( url, _textureLoaded, undefined, _textureMissing );

	return;

	function _textureLoaded( texture ) {

		const material = new MeshLambertMaterial( { transparent: true, opacity: opacity, color: 0xffffff } );

		texture.anisotropy = Cfg.value( 'anisotropy', 4 );

		material.map = texture;
		material.needsUpdate = true;

		self.materialCache[ key ] = material;

		overlayLoaded( material );

	}

	function _textureMissing( /* texture */ ) {

		self.missing.add( url );

		overlayLoaded( missingMaterial );

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
