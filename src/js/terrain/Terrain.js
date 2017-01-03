
import { CommonTerrain } from './CommonTerrain';
import { Tile } from './Tile';

import {
	MeshLambertMaterial,
	TextureLoader,
	Group
} from '../../../../three.js/src/Three';

function Terrain () {

	Group.call( this );

	this.type     = "CV.Terrain";
	this.tile = null;
	this.overlay;

	return this;

}

Terrain.prototype = Object.create( Group.prototype );

Object.assign( Terrain.prototype, CommonTerrain.prototype );

Terrain.prototype.constructor = Terrain;

Terrain.prototype.isTiled = function () {

	return false;

}

Terrain.prototype.isLoaded = function () {

	return true;

}

Terrain.prototype.addTile = function ( plane, terrainData, bitmap ) {

	this.overlay = bitmap;

	var tile = new Tile().create( plane, terrainData );

	this.add( tile );
	this.tile = tile;

	return this;

}

Terrain.prototype.getOverlays = function () {

	if ( this.overlay ) {

		return ["built in"];

	} else {

		return [];

	}

}

Terrain.prototype.getOverlay = function () {

	return "built in";

}

Terrain.prototype.setOverlay = function ( overlay, imageLoadedCallback ) {

	var loader  = new TextureLoader();
	var	texture = loader.load( this.overlay, imageLoadedCallback );

	this.setMaterial( new MeshLambertMaterial(

		{
			map: texture,
			transparent: true,
			opacity: this.opacity
		}

	) );

}

Terrain.prototype.removed = function () {

	this.tile.removed();

}

Terrain.prototype.setMaterial = function ( material ) {

	this.tile.setMaterial( material );

}

Terrain.prototype.setOpacity = function ( opacity ) {

	this.tile.setOpacity( opacity );
	this.opacity = opacity;

}

export { Terrain };

// EOF