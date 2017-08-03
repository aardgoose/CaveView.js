
import { CommonTerrain } from './CommonTerrain';
import { LoxTerrainGeometry } from './LoxTerrainGeometry';

import {
	MeshLambertMaterial,
	TextureLoader
} from '../../../../three.js/src/Three';

function Terrain ( terrainData, offsets ) {

	CommonTerrain.call( this );

	this.type = 'CV.Terrain';
	this.offsets = offsets;
	this.bitmap = terrainData.bitmap;
	this.overlayMaterial = null;

	console.log( terrainData );

	this.geometry = new LoxTerrainGeometry( terrainData.dtm );

//	var width  = ( dtm.samples - 1 ) * dim.xDelta;
//		var height = ( dtm.lines   - 1 ) * dim.yDelta;
//		var clip = { top: 0, bottom: 0, left: 0, right: 0, dtmOffset: 0 };


		// FIXME - rework to allow for lox specific projection adjustments to terrain grid ans UVs
		// remove use of Tiles.

//		var terrainTileGeometry = new TerrainTileGeometry( width, height, dim.samples - 1, dim.lines - 1, terrain.data, 1, clip, self.offsets.z );

//		terrainTileGeometry.translate( dim.xOrigin - self.offsets.x, dim.yOrigin + height - self.offsets.y, 0 );

	return this;

}

Terrain.prototype = Object.create( CommonTerrain.prototype );

Terrain.prototype.constructor = Terrain;

Terrain.prototype.isTiled = false;

Terrain.prototype.isLoaded = function () {

	return true;

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

	var overlayMaterial = this.overlayMaterial;

	if ( overlayMaterial !== null ) {

		// dispose of overlay texture and material

		overlayMaterial.map.dispose();
		overlayMaterial.dispose();

	}

	this.commonRemoved();

};

Terrain.prototype.setMaterial = function ( material ) {

	this.material = material;

};

Terrain.prototype.setOpacity = function ( opacity ) {

	this.material.opacity = opacity;
	this.opacity = opacity;

};

export { Terrain };

// EOF