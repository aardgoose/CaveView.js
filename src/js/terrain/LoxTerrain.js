
import { CommonTerrain } from './CommonTerrain';
import { LoxTerrainGeometry } from './LoxTerrainGeometry';
import { StencilLib } from '../core/StencilLib';
import { Materials } from '../materials/Materials';
import { Cfg } from '../core/lib';
import { FEATURE_TERRAIN } from '../core/constants';

import { MeshLambertMaterial, TextureLoader, Mesh } from '../Three';

function LoxTerrain ( terrainData, offsets ) {

	CommonTerrain.call( this );

	this.type = 'CV.Terrain';
	this.offsets = offsets;
	this.bitmap = terrainData.bitmap;
	this.overlayMaterial = null;
	this.attributions = [];

	const tile = new Mesh( new LoxTerrainGeometry( terrainData.dtm, offsets ), Materials.getHypsometricMaterial() );

	tile.layers.set( FEATURE_TERRAIN );
	tile.isTile = true;
	tile.onBeforeRender = StencilLib.terrainOnBeforeRender;
	tile.onAfterRender = StencilLib.terrainOnAfterRender;

	this.tile = tile;
	this.overlayLoaded = false;

	this.add( tile );

	this.hasOverlay = ( terrainData.bitmap ) ? true : false;

}

LoxTerrain.prototype = Object.create( CommonTerrain.prototype );

LoxTerrain.prototype.isTiled = false;

LoxTerrain.prototype.isLoaded = true;

LoxTerrain.prototype.setOverlay = function ( overlayLoadedCallback ) {

	if ( ! this.hasOverlay ) return;

	if ( this.overlayMaterial !== null ) {

		this.setMaterial( this.overlayMaterial );

		overlayLoadedCallback();

		return;

	}

	if ( this.overlayLoaded ) return;

	const texture = new TextureLoader().load( this.bitmap.image, _overlayLoaded );
	const self = this;

	texture.anisotropy = Cfg.value( 'anisotropy', 4 );

	this.overlayLoaded = true;

	function _overlayLoaded( ) {

		const bitmap = self.bitmap;

		self.tile.geometry.setupUVs( bitmap, texture.image, self.offsets );

		texture.onUpdate = function ( texture ) {

			// release info

			URL.revokeObjectURL( texture.image.src );
			texture.image = null;

		};

		self.overlayMaterial = new MeshLambertMaterial(
			{
				map: texture,
				transparent: true,
				opacity: self.opacity,
			}
		);

		bitmap.data = null;
		bitmap.image = null;

		self.setMaterial( self.overlayMaterial );

		overlayLoadedCallback();

	}

};

LoxTerrain.prototype.removed = function () {

	const overlayMaterial = this.overlayMaterial;

	if ( overlayMaterial !== null ) {

		// dispose of overlay texture and material

		overlayMaterial.map.dispose();
		overlayMaterial.dispose();

	}

	this.commonRemoved();

};

LoxTerrain.prototype.setMaterial = function ( material ) {

	this.tile.material = material;

};

LoxTerrain.prototype.setOpacity = function ( opacity ) {

	const material = this.tile.material;

	material.opacity = opacity;
	material.needsUpdate = true;

	this.opacity = opacity;

};

export { LoxTerrain };

// EOF