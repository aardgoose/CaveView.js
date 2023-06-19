import { BufferGeometry, Mesh, Triangle, Vector3 } from '../Three';
import { FEATURE_TERRAIN } from '../core/constants';
import { hydrateGeometry } from '../core/lib';
import { CommonTerrainMaterial } from '../materials/CommonTerrainMaterial';

const __a = new Vector3();
const __b = new Vector3();
const __c = new Vector3();
const __d = new Vector3();

const __t1 = new Triangle( __a, __b, __c );
const __t2 = new Triangle( __a, __c, __d );

const TILE_NEW      = 0;
const TILE_PENDING  = 1;
const TILE_ACTIVE   = 2;
const TILE_EVICTED  = 3;
const TILE_REPLACED = 4;
const TILE_FAILED   = 5;

class Tile extends Mesh {

	static liveTiles = 0;

	constructor ( ctx, x, y, zoom, tileSpec ) {

		super( new BufferGeometry(), ctx.materials.getMaterial( CommonTerrainMaterial, { color: 0xff8888 } ) );

		this.x = x;
		this.y = y;

		this.zoom    = zoom;
		this.tileSet = tileSpec.tileSet;
		this.clip    = tileSpec.clip;
		this.clippedFraction = tileSpec.clippedFraction;

		this.canZoom = ( zoom < tileSpec.tileSet.overlayMaxZoom );
		this.state = TILE_NEW;
		this.evictionCount = 0;
		this.lastFrame = 0;
		this.childrenLoading = 0;
		this.childErrors = 0;
		this.area = 0;

		this.boundingBox = null;
		this.worldBoundingBox = null;

		this.type = 'Tile';
		this.isTile = false;

	}

	onBeforeRender ( renderer ) {

//		this.lastFrame = renderer.info.render.frame;

	}

	createFromTileData ( tileData, material ) {

		const bufferGeometry = this.geometry;

		hydrateGeometry( bufferGeometry, tileData );

		this.boundingBox = bufferGeometry.boundingBox;

		// discard javascript attribute buffers after upload to GPU
		this.dropBuffers();

		this.layers.set( FEATURE_TERRAIN );

		this.material = material;
		this.isTile = true;

		// handle specific tile data (Cesium has leaf status tiles)
		this.canZoom = tileData.canZoom && this.canZoom;

		// this is safe, we are already in the scene graph from .setPending()
		if ( this.worldBoundingBox === null ) {

			this.updateWorldMatrix( true, false );
			this.worldBoundingBox = this.boundingBox.clone().applyMatrix4( this.matrixWorld );

		}

		return this;

	}

	empty () {

		this.isMesh = false;

		if ( this.geometry ) {

			this.geometry.dispose();
			this.geometry = new BufferGeometry();

		}

		--Tile.liveTiles;

	}

	evict () {

		this.evictionCount = 0;
		this.state = TILE_EVICTED;

		this.children.forEach( tile => tile.evict() );
		this.empty();

	}

	setReplaced () {

		if ( this.state == TILE_REPLACED ) return;

		this.state = TILE_REPLACED;

		this.empty();

	}

	setSkipped () {

		this.parent.childrenLoading--;

		this.state = TILE_REPLACED;

	}

	setPending ( parentTile ) {

		if ( parentTile && this.parent === null ) {

			parentTile.addStatic( this );

		}

		this.parent.childrenLoading++;

		this.isMesh = false;
		this.state = TILE_PENDING;
		this.evictionCount = 0;

	}

	setFailed () {

		const parent = this.parent;

		parent.childErrors++;
		parent.childrenLoading--;
		parent.canZoom = false;

		parent.remove( this );

		this.state = TILE_FAILED;

	}

	setActive () {

		this.isMesh = true;
		this.state = TILE_ACTIVE;

		Tile.liveTiles++;

	}

	setLoaded ( overlay, renderCallback ) {

		const parent = this.parent;

		let tilesWaiting = 0;

		if ( --parent.childrenLoading === 0 ) { // this tile and all siblings loaded

			if ( parent.childErrors === 0 ) { // all loaded without error

				const siblings = parent.children;

				siblings.forEach( sibling => {

					if ( sibling.state !== TILE_PENDING ) return;

					if ( overlay === null ) {

						sibling.setActive();

					} else {

						// delay finalising until overlays loaded - avoids flash of raw surface
						tilesWaiting++;

						sibling
							.setOverlay( overlay )
							.then( () => {

								if ( --tilesWaiting === 0 ) {

									siblings.forEach( tile => {

										if ( tile.state !== TILE_PENDING ) return;

										tile.setActive();

									} );

									if ( parent.isTile ) parent.setReplaced();
									renderCallback( this.canZoom );

									return;

								}

							} );

					}

				} );

				if ( tilesWaiting === 0 ) {

					if ( parent.isTile ) parent.setReplaced();

					renderCallback( false ); // we have no overlay so don't encourage zooming

				}

				return;

			} else {

				parent.remove( this );
				renderCallback( false );

			}

		}

	}

	removed () {

		if ( this.geometry ) this.geometry.dispose();

	}

	setMaterial ( material ) {

		this.material = material;

	}

	setOverlay ( overlay ) {

		return overlay
			.getTile( this )
			.then( material => {

				if ( material !== null ) this.material = material;

				return this;

			} );

	}

	computeProjectedArea ( camera ) {

		const boundingBox = this.worldBoundingBox;
		const z = boundingBox.max.z;

		__a.copy( boundingBox.min ).setZ( z );
		__c.copy( boundingBox.max );

		__b.set( __a.x, __c.y, z );
		__d.set( __c.x, __a.y, z );

		// clamping reduces accuracy of area but stops offscreen area contributing to zoom pressure
		// .clampScalar( -1, 1 );

		__a.project( camera );
		__b.project( camera );
		__c.project( camera );
		__d.project( camera );

		this.area = ( __t1.getArea() + __t2.getArea() ) / this.clippedFraction;

		return this;

	}

}

export { Tile, TILE_PENDING, TILE_ACTIVE, TILE_EVICTED, TILE_REPLACED };