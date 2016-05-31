 "use strict";

var Cave = Cave || {};

CV.Terrain = function () {

	THREE.Group.call( this );

	this.type   = "CV.Terrain";
	this.tile   = null;
	this.overlay;

	return this;

}

CV.Terrain.prototype = Object.create( THREE.Group.prototype );

CV.Terrain.prototype.constructor = CV.Terrain;

CV.Terrain.prototype.isTiled = function () {

	return false;

}

CV.Terrain.prototype.isLoaded = function () {

	return true;

}

CV.Terrain.prototype.addTile = function ( plane, terrainData, bitmap ) {

	this.overlay = bitmap;

	var tile = new CV.Tile().create( plane, terrainData );

	this.add( tile.mesh )
	this.tile = tile;

	return this;

}

CV.Terrain.prototype.getOverlays = function () {

	if ( this.overlay ) {

		return ["built in"];

	} else {

		return [];

	}

}

CV.Terrain.prototype.getOverlay = function () {

	return "built in";

}

CV.Terrain.prototype.setOverlay = function ( overlay ) {

	var loader  = new THREE.TextureLoader();
	var	texture = loader.load( this.overlay );

	this.setMaterial( new THREE.MeshLambertMaterial(

		{
			map: texture,
			transparent: true,
			opacity: 0.75
		}

	) );

}

CV.Terrain.prototype.setMaterial = function ( material ) {

	this.tile.setMaterial( material );

}

// EOF