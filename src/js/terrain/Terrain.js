
import { CommonTerrain } from './CommonTerrain';
import { Tile } from './Tile';

import {
	MeshLambertMaterial,
	TextureLoader
} from '../../../../three.js/src/Three';

function Terrain () {

	CommonTerrain.call( this );

	this.type = 'CV.Terrain';
	this.tile = null;

	return this;

}

Terrain.prototype = Object.create( CommonTerrain.prototype );

Terrain.prototype.constructor = Terrain;

Terrain.prototype.isTiled = false;

Terrain.prototype.isLoaded = function () {

	return true;

};

Terrain.prototype.addTile = function ( terrainTileGeometry, bitmap ) {

	this.bitmap = bitmap;

	if ( bitmap !== undefined ) this.hasOverlay = true;

	var tile = new Tile().create( terrainTileGeometry );

	this.add( tile );
	this.tile = tile;

	return this;

};

Terrain.prototype.setOverlay = function ( overlay, overlayLoadedCallback ) {

	var loader  = new TextureLoader();
	var	texture = loader.load( this.bitmap, overlayLoadedCallback );

	this.setMaterial( new MeshLambertMaterial(

		{
			map: texture,
			transparent: true,
			opacity: this.opacity
		}

	) );

};

Terrain.prototype.removed = function () {

	this.tile.removed();
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