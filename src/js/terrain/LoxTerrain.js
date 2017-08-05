
import { CommonTerrain } from './CommonTerrain';
import { LoxTerrainGeometry } from './LoxTerrainGeometry';
import { terrainLib } from './terrainLib';
import { Materials } from '../materials/Materials';

import { FEATURE_TERRAIN } from '../core/constants';
import { MeshLambertMaterial, TextureLoader, Mesh } from '../../../../three.js/src/Three';

function LoxTerrain ( terrainData, offsets ) {

	CommonTerrain.call( this );

	this.type = 'CV.Terrain';
	this.offsets = offsets;
	this.bitmap = terrainData.bitmap;
	this.overlayMaterial = null;

	var tile = new Mesh( new LoxTerrainGeometry( terrainData.dtm, offsets ), Materials.getSurfaceMaterial() );

	tile.layers.set( FEATURE_TERRAIN );
	tile.isTile = true;
	tile.onBeforeRender = terrainLib.onBeforeRender;
	tile.onAfterRender = terrainLib.onAfterRender;

	this.tile = tile;

	this.add( tile );

	this.hasOverlay = ( terrainData.bitmap  ) ? true : false;

}

LoxTerrain.prototype = Object.create( CommonTerrain.prototype );

LoxTerrain.prototype.constructor = LoxTerrain;

LoxTerrain.prototype.isTiled = false;

LoxTerrain.prototype.isLoaded = function () {

	return true;

};

LoxTerrain.prototype.setOverlay = function ( overlay, overlayLoadedCallback ) {

	if ( this.overlayMaterial !== null ) {

		this.setMaterial( this.overlayMaterial );

		overlayLoadedCallback();

		return;

	}

	var	texture = new TextureLoader().load( this.bitmap.image, _overlayLoaded );

	var self = this;

	function _overlayLoaded( ) {

		var bitmap = self.bitmap;

		self.tile.geometry.setupUVs( bitmap, texture.image, self.offsets );

		self.overlayMaterial = new MeshLambertMaterial(
			{
				map: texture,
				transparent: true,
				opacity: self.opacity
			}
		);

		bitmap.data = null;

		self.setMaterial( self.overlayMaterial );

		overlayLoadedCallback();

	}

};

LoxTerrain.prototype.removed = function () {

	var overlayMaterial = this.overlayMaterial;

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

	var material = this.tile.material;

	material.opacity = opacity;
	material.needsUpdate = true;

	this.opacity = opacity;

};

export { LoxTerrain };

// EOF