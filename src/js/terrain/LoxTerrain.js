import { CommonTerrain } from './CommonTerrain';
import { LoxTerrainGeometry } from './LoxTerrainGeometry';
import { FEATURE_TERRAIN } from '../core/constants';
import { TerrainOverlayMaterial } from '../materials/TerrainOverlayMaterial';

import { TextureLoader, Mesh, Box3 } from '../Three';

function LoxTile( ctx, terrain, offsets ) {

	Mesh.call( this, new LoxTerrainGeometry( terrain.dtm, offsets ), ctx.materials.getSurfaceMaterial() );

	this.type = 'CV.LoxTile';
	this.layers.set( FEATURE_TERRAIN );
	this.overlayMaterial = null;
	this.ctx = ctx;

	if ( terrain.bitmap === undefined ) {

		this.bitmap = null;

	} else {

		this.bitmap = terrain.bitmap;
		this.offsets = offsets;

	}

}

LoxTile.prototype = Object.create( Mesh.prototype );

LoxTile.prototype.isTile = true;

LoxTile.prototype.loadOverlay = function ( ctx, overlayLoadedCallback ) {

	if ( this.bitmap === null ) return;

	const texture = new TextureLoader().load( this.bitmap.image, _overlayLoaded );
	const self = this;

	texture.anisotropy = this.ctx.cfg.value( 'anisotropy', 4 );

	return;

	function _overlayLoaded () {

		const bitmap = self.bitmap;

		self.geometry.setupUVs( bitmap, texture.image, self.offsets );

		texture.onUpdate = function ( texture ) {

			// release info

			URL.revokeObjectURL( texture.image.src );
			texture.image = null;

		};

		self.overlayMaterial = new TerrainOverlayMaterial( ctx );

		self.overlayMaterial.map = texture;
		self.overlayMaterial.setThroughMode( self.parent.throughMode );

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

function LoxTerrain ( ctx, terrains, offsets ) {

	CommonTerrain.call( this, ctx );

	this.type = 'CV.Terrain';
	this.overlayMaterial = null;
	this.attributions = [];

	const self = this;

	var bitmapCount = 0;

	terrains.forEach( function ( terrain ) {

		const tile = new LoxTile( ctx, terrain, offsets );

		if ( tile.bitmap !== null ) bitmapCount++;

		self.add( tile );

	} );

	this.overlayLoaded = false;
	this.hasOverlay = ( bitmapCount > 0 ) ? true : false;

}

LoxTerrain.prototype = Object.create( CommonTerrain.prototype );

LoxTerrain.prototype.isTiled = false;

LoxTerrain.prototype.isLoaded = true;

LoxTerrain.prototype.setOverlay = function ( overlayLoadedCallback ) {

	if ( ! this.hasOverlay ) return;

	const self = this;

	if ( this.overlayLoaded ) {

		this.children.forEach( function ( tile ) {

			if ( tile.overlayMaterial !== null ) {

				tile.material = tile.overlayMaterial;
				tile.material.setThroughMode( self.throughMode );

			}

		} );

		overlayLoadedCallback();

		return;

	}

	this.children.forEach( function ( tile ) { tile.loadOverlay( self.ctx, overlayLoadedCallback ); } );

	this.overlayLoaded = true;

};

LoxTerrain.prototype.removed = function () {

	this.children.forEach( function ( tile ) { tile.removed(); } );

	this.commonRemoved();

};

LoxTerrain.prototype.setMaterial = function ( material ) {

	this.children.forEach( function ( tile ) { tile.material = material; } );

};

LoxTerrain.prototype.fitSurface = CommonTerrain.prototype._fitSurface;

export { LoxTerrain };