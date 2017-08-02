
import { CommonTerrain } from './CommonTerrain';
import { Tile } from './Tile';

import {
	MeshLambertMaterial,
	TextureLoader
} from '../../../../three.js/src/Three';

function Terrain ( offsets ) {

	CommonTerrain.call( this );

	this.type = 'CV.Terrain';
	this.tile = null;
	this.offsets = offsets;
	this.overlayMaterial = null;

	return this;

}

Terrain.prototype = Object.create( CommonTerrain.prototype );

Terrain.prototype.constructor = Terrain;

Terrain.prototype.isTiled = false;

Terrain.prototype.isLoaded = function () {

	return true;

};

Terrain.prototype.addTile = function ( terrainTileGeometry, bitmap ) {

	// fixme - use custom lox terrain to handle non uniform grid

	this.bitmap = bitmap;

	if ( bitmap !== undefined ) this.hasOverlay = true;

	var tile = new Tile().create( terrainTileGeometry );

	this.add( tile );
	this.tile = tile;

	return this;

};

Terrain.prototype.setOverlay = function ( overlay, overlayLoadedCallback ) {

	if ( this.overlayMaterial !== null ) {

		this.setMaterial( this.overlayMaterial );
		overlayLoadedCallback();

		return;

	}

	var	texture = new TextureLoader().load( this.bitmap.image, _overlayLoaded );

	var self = this;

	function _overlayLoaded( ) {

		var bitmap = self.bitmap;

		var overlayWidth  = texture.image.naturalWidth * bitmap.xDelta;
		var overlayHeight = texture.image.naturalHeight * bitmap.yDelta;

		var surveySize = self.tile.geometry.boundingBox.size();

		// adjust overlay -> terrain sizing to reflect differences in geographical areas

		texture.repeat.set( surveySize.x / overlayWidth, surveySize.y / overlayHeight );

		// adjust overlay -> terrain offset to reflect differences in geographical origins

		var surveyOrigin = self.tile.geometry.boundingBox.min;

		var xOffset = surveyOrigin.x - bitmap.xOrigin + self.offsets.x;
		var yOffset = surveyOrigin.y - bitmap.yOrigin + self.offsets.y;

		texture.offset.set( xOffset / overlayWidth, yOffset / overlayHeight );

		self.overlayMaterial = new MeshLambertMaterial(
			{
				map: texture,
				transparent: true,
				opacity: self.opacity
			}
		);

		self.setMaterial( self.overlayMaterial );

		overlayLoadedCallback();

	}

};

Terrain.prototype.removed = function () {

	this.tile.removed();

	var overlayMaterial = this.overlayMaterial;

	if ( overlayMaterial !== null ) {

		// dispose of overlay texture and material

		overlayMaterial.map.dispose();
		overlayMaterial.dispose();

	}

	this.commonRemoved();

};

Terrain.prototype.setMaterial = function ( material ) {

	this.tile.setMaterial( material );

};

Terrain.prototype.setOpacity = function ( opacity ) {

	this.tile.setOpacity( opacity );
	this.opacity = opacity;

};

export { Terrain };

// EOF