
import { CommonTerrain } from './CommonTerrain';
import { LoxTerrainGeometry } from './LoxTerrainGeometry';
import { Materials } from '../materials/Materials';
import { Cfg } from '../core/lib';
import { FEATURE_TERRAIN } from '../core/constants';

import { MeshLambertMaterial, TextureLoader, Mesh, Box3 } from '../Three';

function LoxTile( terrain, offsets ) {

	Mesh.call( this, new LoxTerrainGeometry( terrain.dtm, offsets ), Materials.getSurfaceMaterial( 0xff8888 ) );

	this.type = 'CV.LoxTile';
	this.layers.set( FEATURE_TERRAIN );
	this.overlayMaterial = null;

	if ( terrain.bitmap === undefined ) {

		this.bitmap = null;

	} else {

		this.bitmap = terrain.bitmap;
		this.offsets = offsets;

	}

}

LoxTile.prototype = Object.create( Mesh.prototype );

LoxTile.prototype.isTile = true;

LoxTile.prototype.loadOverlay = function ( overlayLoadedCallback ) {

	if ( this.bitmap === null ) return;

	const texture = new TextureLoader().load( this.bitmap.image, _overlayLoaded );
	const self = this;

	texture.anisotropy = Cfg.value( 'anisotropy', 4 );

	return;

	function _overlayLoaded () {

		const bitmap = self.bitmap;

		self.geometry.setupUVs( bitmap, texture.image, self.offsets );

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

		self.material = self.overlayMaterial;

		overlayLoadedCallback();

	}

};

LoxTile.prototype.removed = function () {

	const material = this.overlayMaterial;

	if ( material !== null ) {

		material.map.dispose();
		material.dispose();

	}

	this.geometry.dispose();

};

function LoxTerrain ( terrains, offsets ) {

	CommonTerrain.call( this );

	this.type = 'CV.Terrain';
	this.overlayMaterial = null;
	this.attributions = [];

	const self = this;

	var bitmapCount = 0;

	terrains.forEach( function ( terrain ) {

		const tile = new LoxTile( terrain, offsets );

		if ( tile.bitmap !== null ) bitmapCount++;

		self.add( tile );

	} );

	this.overlayLoaded = false;
	this.hasOverlay = ( bitmapCount > 0 ) ? true : false;

}

LoxTerrain.prototype = Object.create( CommonTerrain.prototype );

LoxTerrain.prototype.isTiled = false;

LoxTerrain.prototype.isLoaded = true;

LoxTerrain.prototype.getBoundingBox = function () {

	const box = new Box3();

	this.children.forEach( function ( tile ) { box.union( tile.geometry.boundingBox ); } );

	return box;

};

LoxTerrain.prototype.setOverlay = function ( overlayLoadedCallback ) {

	if ( ! this.hasOverlay ) return;

	if ( this.overlayLoaded ) {

		this.children.forEach( function ( tile ) {

			if ( tile.overlayMaterial !== null ) {

				tile.material = tile.overlayMaterial;

			}

		} );

		overlayLoadedCallback();

		return;

	}

	this.children.forEach( function ( tile ) { tile.loadOverlay( overlayLoadedCallback ); } );

	this.overlayLoaded = true;

};

LoxTerrain.prototype.removed = function () {

	this.children.forEach( function ( tile ) { tile.removed(); } );

	this.commonRemoved();

};

LoxTerrain.prototype.setMaterial = function ( material ) {

	this.children.forEach( function ( tile ) { tile.material = material; } );

};

LoxTerrain.prototype.setOpacity = function ( opacity ) {

	this.children.forEach( function ( tile ) {

		const material = tile.material;

		tile.opacity = opacity;

		material.opacity = opacity;
		material.needsUpdate = true;

	} );

	this.opacity = opacity;

};

export { LoxTerrain };

// EOF