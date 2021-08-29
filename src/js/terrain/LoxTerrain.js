import { CommonTerrain } from './CommonTerrain';
import { LoxTerrainGeometry } from './LoxTerrainGeometry';
import { FEATURE_TERRAIN } from '../core/constants';
import { TerrainOverlayMaterial } from '../materials/TerrainOverlayMaterial';

import { TextureLoader, Mesh } from '../Three';

class LoxTile extends Mesh {

	constructor ( ctx, terrain, offsets ) {

		super( new LoxTerrainGeometry( terrain.dtm, offsets ), ctx.materials.getSurfaceMaterial() );

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

}

LoxTile.prototype.isTile = true;

LoxTile.prototype.loadOverlay = function ( ctx, overlayLoadedCallback, material ) {

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

		self.material = [ self.overlayMaterial, material ];
//		self.material = [ self.overlayMaterial ];

		self.geometry.addGroup( 0, Infinity, 0 );
		self.geometry.addGroup( 0, Infinity, 1 );

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

class LoxTerrain extends CommonTerrain {

	constructor ( ctx, terrains, offsets ) {

		super( ctx );

		this.type = 'CV.Terrain';
		this.overlayMaterial = null;
		this.attributions = [];

		let bitmapCount = 0;

		terrains.forEach( terrain => {

			const tile = new LoxTile( ctx, terrain, offsets );

			if ( tile.bitmap !== null ) bitmapCount++;

			this.add( tile );

		} );

		this.overlayLoaded = false;
		this.hasOverlay = ( bitmapCount > 0 ) ? true : false;

	}

}

LoxTerrain.prototype.isTiled = false;
LoxTerrain.prototype.isLoaded = true;

LoxTerrain.prototype.setOverlay = function ( overlayLoadedCallback, material ) {

	if ( ! this.hasOverlay ) return;

	if ( this.overlayLoaded ) {

		this.children.forEach( tile => {

			if ( tile.overlayMaterial !== null ) {

				console.log( 'dd' );
				tile.material = [ tile.overlayMaterial, material ];
//				tile.material.setThroughMode( this.throughMode );

			}

		} );

		overlayLoadedCallback();

		return;

	}

	this.children.forEach( tile => tile.loadOverlay( this.ctx, overlayLoadedCallback, material ) );

	this.overlayLoaded = true;

};

LoxTerrain.prototype.removed = function () {

	this.children.forEach( tile => tile.removed() );

	this.commonRemoved();

};

LoxTerrain.prototype.setMaterial = function ( material ) {

	this.children.forEach( tile => tile.material = material );

};

LoxTerrain.prototype.fitSurface = CommonTerrain.prototype._fitSurface;

export { LoxTerrain };