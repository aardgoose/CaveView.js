
import { CommonTerrain } from './CommonTerrain.js';
import { TileMesh } from './TileMesh.js';

import {
	MeshLambertMaterial,
	TextureLoader,
	Group
} from '../../../../three.js/src/Three.js';

function Terrain () {

	Group.call( this );

	this.type     = "CV.Terrain";
	this.tileMesh = null;
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

	var tileMesh = new TileMesh().create( plane, terrainData );

	this.add( tileMesh );
	this.tileMesh = tileMesh;

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

Terrain.prototype.dispose = function () {

	//this.tileMesh.dispose();

}

Terrain.prototype.setMaterial = function ( material ) {

	this.tileMesh.setMaterial( material );

}

Terrain.prototype.setOpacity = function ( opacity ) {

	this.tileMesh.setOpacity( opacity );
	this.opacity = opacity;

}

export { Terrain };

// EOF