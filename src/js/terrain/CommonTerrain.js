import {
	FEATURE_TERRAIN, SHADING_RELIEF, SHADING_OVERLAY, SHADING_CONTOURS
} from '../core/constants';
import { DepthMapMaterial } from '../materials/DepthMapMaterial';

import { unpackRGBA } from '../core/unpackRGBA';
import { Overlay } from './Overlay';
import {
	Group, Box3, Vector3,
	WebGLRenderTarget, LinearFilter, NearestFilter, RGBAFormat
} from '../Three';
import { RenderUtils } from '../core/RenderUtils';

// preallocated tmp objects

const __vector3 = new Vector3();
const __adjust = new Vector3();

class CommonTerrain extends Group {

	constructor ( ctx ) {

		super();

		this.hasOverlay = false;
		this.activeOverlay = null;
		this.depthTexture = null;
		this.renderer = null;
		this.renderTarget = null;
		this.heightMap = null;
		this.datumShift = 0;
		this.activeDatumShift = 0;
		this.terrainBase = null;
		this.terrainRange = null;
		this.isFlat = false;
		this.screenAttribution = null;
		this.terrainShadingModes = {};
		this.commonUniforms = ctx.materials.commonTerrainUniforms;
		this.ctx = ctx;
		this.shadingMode = SHADING_RELIEF;

		this.addEventListener( 'removed', () => this.removed() );

	}

	removed () {}

	getOpacity () {

		return this.ctx.materials.terrainOpacity;

	}

	setOpacity ( opacity ) {

		this.ctx.materials.terrainOpacity = opacity;

	}

	commonRemoved () {

		const activeOverlay = this.activeOverlay;

		if ( activeOverlay !== null ) activeOverlay.setInactive();

		if ( this.renderTarget !== null ) this.renderTarget.dispose();

	}

	checkTerrainShadingModes ( renderer ) {

		const overlays = this.ctx.overlays;
		const terrainShadingModes = {};

		terrainShadingModes[ 'terrain.shading.height' ] = SHADING_RELIEF;

		if ( renderer.capabilities.isWebGL2 || renderer.extensions.get( 'OES_standard_derivatives' ) !== null && ! this.isFlat ) {

			terrainShadingModes[ 'terrain.shading.contours' + ' (' + this.ctx.cfg.themeValue( 'shading.contours.interval' ) + '\u202fm)' ] = SHADING_CONTOURS;

		}

		if ( this.isTiled && overlays) {

			Object.keys( overlays ).sort().forEach( name => {

				const overlay = overlays[ name ];

				if ( overlay.checkCoverage( this.limits, this.displayCRS, this.surveyCRS ) ) {

					overlay.active = ( this.activeOverlay === overlay );
					terrainShadingModes[ name ] = name;

				}

			} );

		} else if ( this.hasOverlay ) {

			terrainShadingModes[ 'terrain.shading.overlay' ] = SHADING_OVERLAY;

		}

		this.terrainShadingModes = terrainShadingModes;

		return terrainShadingModes;

	}

	setup ( renderer, scene, survey ) {

		this.computeBoundingBox();

		survey.addStatic( this );

		const dim = 1024;

		const container = this.ctx.container;

		// set camera frustrum to cover region/survey area
		const rtCamera = RenderUtils.makePlanCamera( container, survey );

		rtCamera.layers.set( FEATURE_TERRAIN ); // just render the terrain

		const renderTarget = new WebGLRenderTarget( dim, dim, { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat, stencilBuffer: true } );

		renderTarget.texture.generateMipmaps = false;
		renderTarget.texture.name = 'CV.DepthMapTexture';

		renderer.setSize( dim, dim );
		renderer.setPixelRatio( 1 );

		renderer.clear();

		renderer.setRenderTarget( renderTarget );

		scene.overrideMaterial = new DepthMapMaterial( this );

		renderer.render( scene, rtCamera );

		scene.overrideMaterial = null;

		// get height map into array - much faster access

		const buffer = new Uint8ClampedArray( dim * dim * 4 );
		renderer.readRenderTargetPixels( renderTarget, 0, 0, dim, dim, buffer );

		// correct height between entrances and terrain

		this.addHeightMap( renderer, renderTarget, buffer );

		this.checkTerrainShadingModes( renderer );

		// restore renderer to normal render size and target

		renderer.renderLists.dispose();

		// restore renderer to normal render size and target

		this.ctx.viewer.resetRenderer();

		survey.setupTerrain( this );
		this.ctx.materials.setTerrain( this );

	}

	setShadingMode ( mode, renderCallback ) {

		const activeOverlay = this.activeOverlay;
		const materials = this.ctx.materials;
		const overlays = this.ctx.overlays;

		let material;
		let hideAttribution = true;
		let overlay = null;

		switch ( mode ) {

		case SHADING_RELIEF:

			material = materials.getHypsometricMaterial();

			break;

		case SHADING_OVERLAY:

			this.setOverlay( renderCallback );
			hideAttribution = false;

			break;

		case SHADING_CONTOURS:

			material = materials.getContourMaterial();

			break;

		default:

			overlay = overlays[ mode ];

			if ( overlay !== undefined ) {

				if ( this.isTiled && overlay.hasCoverage ) {

					this.setOverlay( overlay, renderCallback );
					hideAttribution = false;

				} else {

					// if initial setting is not valid, default to shaded relief
					material = materials.getHypsometricMaterial();
					mode = SHADING_RELIEF;

				}

			} else {

				console.warn( 'unknown mode', mode );
				return false;

			}

		}

		if ( hideAttribution && activeOverlay !== null ) {

			activeOverlay.setInactive();

			this.activeOverlay = null;

		}

		if ( material !== undefined ) {

			this.setMaterial( material );

		}

		this.shadingMode = mode;

		return true;

	}

	setVisibility ( mode ) {

		this.visible = mode;

		if ( mode ) {

			this.showAttribution();

		} else {

			this.hideAttribution();

		}

	}

	showAttribution () {

		const attribution = this.screenAttribution;

		if ( attribution !== null ) {

			this.ctx.container.appendChild( attribution );

		}

		if ( this.activeOverlay !== null ) this.activeOverlay.showAttribution();

	}

	hideAttribution () {

		const attribution = this.screenAttribution;

		if ( attribution !== null ) {

			const parent = attribution.parentNode;

			if ( parent !== null ) parent.removeChild( attribution );


		}

		if ( this.activeOverlay !== null ) this.activeOverlay.hideAttribution();

	}

	applyDatumShift ( mode ) {

		if ( mode && this.activeDatumShift === 0 ) {

			this.translateZ( this.datumShift );
			this.activeDatumShift = this.datumShift;

		} else if ( ! mode && this.activeDatumShift !== 0 ) {

			this.translateZ( - this.datumShift );
			this.activeDatumShift = 0;

		}

		this.updateMatrix();

		this.dispatchEvent( { type: 'datumShiftChange', value: this.activeDatumShift } );

	}

	computeBoundingBox () {

		const bb = new Box3();

		this.traverse( _getBoundingBox );

		this.boundingBox = bb;

		function _getBoundingBox( obj ) {

			if ( obj.isTile && obj.isMesh ) bb.union( obj.geometry.boundingBox );

		}

		return bb;

	}

	addHeightMap ( renderer, renderTarget, buffer ) {

		this.depthTexture = renderTarget.texture;
		this.renderer = renderer;
		this.renderTarget = renderTarget;
		this.heightMap = buffer;

	}

	getHeight ( point ) {

		if ( this.terrainBase === null ) {

			if ( this.boundingBox === undefined ) this.computeBoundingBox();

			this.terrainBase = this.boundingBox.min;
			this.terrainRange = this.boundingBox.getSize( new Vector3() );

			// setup value cached

			__adjust.set( 1024, 1024, 1 ).divide( this.terrainRange );

		}

		const terrainBase = this.terrainBase;

		__vector3.copy( point ).sub( terrainBase ).multiply( __adjust ).round();

		const offset = ( __vector3.x + __vector3.y * 1024 ) * 4;

		// convert to survey units and return

		return unpackRGBA( this.heightMap.subarray( offset, offset + 4 ) ) * this.terrainRange.z + terrainBase.z;

	}

	_fitSurface ( modelPoints /*, offsets */ ) {

		const points = modelPoints;

		let n = 0, s1 = 0, s2 = 0;

		points.forEach( point => {

			const v = this.getHeight( point );
			s1 += v;
			s2 += v * v;
			n++;

		} );

		const sd = Math.sqrt( s2 / n - Math.pow( s1 / n, 2 ) );

		// simple average
		this.datumShift = s1 / n;

		console.log( 'Adjustmenting terrain height by:', this.datumShift, 'sd:', sd );

	}

}

CommonTerrain.addOverlay = function ( ctx, name, overlayProvider ) {

	if ( ctx.overlays === undefined ) ctx.overlays = {};

	ctx.overlays[ name ] = new Overlay( ctx, overlayProvider );

};


export { CommonTerrain };