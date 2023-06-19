import { Box2, Color, TextureLoader, Vector2 } from '../Three';
import { CommonTerrainMaterial } from '../nodeMaterials/CommonTerrainMaterial';
import { TerrainOverlayMaterial } from '../nodeMaterials/TerrainOverlayMaterial';
import proj4 from 'proj4';

class Overlay {

	constructor ( ctx, overlayProvider ) {

		this.provider = overlayProvider;
		this.active = false;
		this.hasCoverage = false;
		this.crsSupported = overlayProvider.crsSupported === undefined ? [ 'EPSG:3857', 'EPSG:4326', 'ORIGINAL' ] : overlayProvider.crsSupported;
		this.ctx = ctx;

		const attribution = overlayProvider.getAttribution();

		if ( attribution ) {

			const c = new Color( ctx.cfg.themeValue( 'background' ) );
			const hsl = { h: 0, s: 0, l: 0 };

			c.getHSL( hsl );

			attribution.classList.add( 'overlay-branding' );
			attribution.style.color = hsl.l < 0.5 ? 'white' : 'black';

			this.attribution = attribution;

		}

		this.materialCache = new Map();
		this.missing = new Set();

		const coverage = overlayProvider.coverage;

		if ( coverage !== undefined ) {

			this.coverage = new Box2(
				new Vector2( coverage.minX, coverage.minY ),
				new Vector2( coverage.maxX, coverage.maxY )
			);

		}

	}

	getMinZoom () {

		return this.provider.minZoom;

	}

	checkCoverage ( limits, displayCRS, surveyCRS ) {

		const coverage = this.coverage;

		if ( this.crsSupported.indexOf( displayCRS ) === -1 ) return false;

		// transform survey limits to wgs84 for comparison with overlay limits

		const transform = proj4( ( displayCRS === 'ORIGINAL' ? surveyCRS : displayCRS ), 'WGS84' );
		const wgs84Limits = new Box2();

		wgs84Limits.expandByPoint( transform.forward( { x: limits.min.x, y: limits.min.y } ) );
		wgs84Limits.expandByPoint( transform.forward( { x: limits.min.x, y: limits.max.y } ) );
		wgs84Limits.expandByPoint( transform.forward( { x: limits.max.x, y: limits.min.y } ) );
		wgs84Limits.expandByPoint( transform.forward( { x: limits.max.x, y: limits.max.y } ) );

		this.provider.crs = displayCRS;
		this.hasCoverage = ( coverage === undefined ) ? true : coverage.intersectsBox( wgs84Limits );

		return this.hasCoverage;

	}

	showAttribution () {

		const attribution = this.attribution;

		if ( attribution !== undefined ) this.ctx.container.appendChild( attribution );

	}

	hideAttribution () {

		const attribution = this.attribution;
		const parent = attribution.parentNode;

		if ( parent !== null ) parent.removeChild( attribution );

	}

	getTile ( tile ) {

		let x = tile.x;
		let y = tile.y;
		let z = tile.zoom;

		const cfg = this.ctx.cfg;
		const materials = this.ctx.materials;

		const material = this.materialCache.get( tile );
		const overlayMaxZoom = this.provider.maxZoom;

		let repeat = 1;
		let xOffset = 0;
		let yOffset = 0;

		if ( material !== undefined ) {

			return Promise.resolve( this.active ? material : null );

		}

		const zoomDelta = z - overlayMaxZoom;

		if ( zoomDelta > 0 ) {

			const scale = Math.pow( 2, zoomDelta );

			repeat = 1 / scale;

			// get image for lower zoom
			const newX = Math.floor( x * repeat );
			const newY = Math.floor( y * repeat );

			xOffset = ( x - newX * scale ) / scale;
			yOffset = 1 - ( y - newY * scale ) / scale;
			yOffset -= repeat;

			x = newX;
			y = newY;
			z = overlayMaxZoom;

		}

		let urlPromise;

		if ( this.provider.getPromise ) {

			urlPromise = this.provider.getPromise( x, y, z );

		} else {

			const url = this.provider.getUrl( x, y, z );

			if ( url === null || this.missing.has( url ) ) {

				return Promise.resolve( materials.getMaterial( CommonTerrainMaterial, { color: 0xff8888 } ) );

			}

			urlPromise = Promise.resolve( url );

		}

		return urlPromise.then( url => {

			return new Promise( resolve => {

				new TextureLoader()
					.setCrossOrigin( 'anonymous' )
					.load(
						url,
						// success handler
						texture => {

							if ( ! this.active ) {

								texture.dispose();

								resolve( null );
								return;

							}

							const material = new TerrainOverlayMaterial( this.ctx );

							texture.anisotropy = cfg.value( 'anisotropy', 4 );
							texture.repeat.setScalar( repeat );
							texture.offset.set( xOffset, yOffset );

							material.map = texture;
							material.needsUpdate = true;

							this.materialCache.set( tile, material );

							resolve( material );

						},

						// progress handler
						undefined,
						// error handler
						() => {

							this.missing.add( url );
							resolve( this.active ? materials.getMaterial( CommonTerrainMaterial, { color: 0xff8888 } ) : null );

						}
					);
			} );

		} );

	}

	setActive () {

		this.showAttribution();
		this.active = true;

	}

	setInactive () {

		// flush cache
		this.materialCache.forEach( material => {

			material.map.dispose();
			material.dispose();

		} );

		this.materialCache.clear();

		this.hideAttribution();
		this.active = false;

	}

}

export { Overlay };