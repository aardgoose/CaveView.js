
import { CommonTerrain } from './CommonTerrain.js';
import { Tile } from './Tile.js';

function Terrain () {

	THREE.Group.call( this );

	this.type     = "CV.Terrain";
	this.tile     = null;
	this.overlay;

	return this;

}

Terrain.prototype = Object.create( THREE.Group.prototype );

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

	this.add( tile.mesh )
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

Terrain.prototype.setOverlay = function ( overlay ) {

	var loader  = new THREE.TextureLoader();
	var	texture = loader.load( this.overlay );

	this.setMaterial( new THREE.MeshLambertMaterial(

		{
			map: texture,
			transparent: true,
			opacity: this.opacity
		}

	) );

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