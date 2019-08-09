
import { FEATURE_TERRAIN, SHADING_RELIEF, SHADING_OVERLAY, SHADING_CONTOURS } from '../core/constants';
import { Cfg } from '../core/lib';
import { Materials } from '../materials/Materials';
import { CommonTerrainUniforms } from '../materials/CommonTerrainUniforms';
import { unpackRGBA } from '../core/unpackRGBA';
import { Overlay } from './Overlay';
import {
	Group, OrthographicCamera,
	Box3, Vector3,
	WebGLRenderTarget, LinearFilter, NearestFilter, RGBAFormat
} from '../Three';

const overlays = {};

// preallocated tmp objects

const __vector3 = new Vector3();
const __adjust = new Vector3();

const __result = new Uint8Array( 4 );

function CommonTerrain () {

	Group.call( this );

	this.hasOverlay = false;
	this.activeOverlay = null;
	this.depthTexture = null;
	this.renderer = null;
	this.renderTarget = null;
	this.datumShift = 0;
	this.activeDatumShift = 0;
	this.terrainBase = null;
	this.terrainRange = null;
	this.isFlat = false;
	this.screenAttribution = null;
	this.terrainShadingModes = {};

	this.addEventListener( 'removed', function removeTerrain() { this.removed(); } );

}

CommonTerrain.addOverlay = function ( name, overlayProvider, container ) {

	overlays[ name ] = new Overlay( overlayProvider, container );

};

CommonTerrain.prototype = Object.create( Group.prototype );

CommonTerrain.prototype.shadingMode = SHADING_RELIEF;
CommonTerrain.prototype.opacity = 0.5;

CommonTerrain.prototype.removed = function () {};

CommonTerrain.prototype.getOpacity = function () {

	return this.opacity;

};

CommonTerrain.prototype.commonRemoved = function () {

	const activeOverlay = this.activeOverlay;

	if ( activeOverlay !== null ) activeOverlay.setInactive();

	if ( this.renderTarget !== null ) this.renderTarget.dispose();

};

CommonTerrain.prototype.checkTerrainShadingModes = function ( renderer ) {

	const terrainShadingModes = {};

	terrainShadingModes[ 'terrain.shading.height' ] = SHADING_RELIEF;

	if ( renderer.capabilities.isWebGL2 || renderer.extensions.get( 'OES_standard_derivatives' ) !== null && ! this.isFlat ) {

		terrainShadingModes[ 'terrain.shading.contours' + ' (' + Cfg.themeValue( 'shading.contours.interval' ) + '\u202fm)' ] = SHADING_CONTOURS;

	}

	if ( this.isTiled ) {

		var name;

		for ( name in overlays ) {

			const overlay = overlays[ name ];

			if ( overlay.checkCoverage( this.limits, this.displayCRS, this.surveyCRS ) ) {

				overlay.active = ( this.activeOverlay === overlay );
				terrainShadingModes[ name ] = name;

			}

		}

	} else if ( this.hasOverlay ) {

		terrainShadingModes[ 'terrain.shading.overlay' ] = SHADING_OVERLAY;

	}

	this.terrainShadingModes = terrainShadingModes;

	return terrainShadingModes;

};

CommonTerrain.prototype.setup = function ( renderer, scene, survey ) {

	const dim = 1024;

	// set camera frustrum to cover region/survey area
	const container = renderer.domElement.parentElement;
	const originalRenderTarget = renderer.getRenderTarget();

	var width  = container.clientWidth;
	var height = container.clientHeight;

	const range = survey.combinedLimits.getSize( __vector3 );

	const scaleX = width / range.x;
	const scaleY = height / range.y;

	if ( scaleX < scaleY ) {

		height = height * scaleX / scaleY;

	} else {

		width = width * scaleY / scaleX;

	}

	// render the terrain to a new canvas square canvas and extract image data

	const rtCamera = new OrthographicCamera( -width / 2, width / 2, height / 2, -height / 2, -10000, 10000 );

	rtCamera.layers.set( FEATURE_TERRAIN ); // just render the terrain

	const renderTarget = new WebGLRenderTarget( dim, dim, { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat, stencilBuffer: true } );

	renderTarget.texture.generateMipmaps = false;
	renderTarget.texture.name = 'CV.DepthMapTexture';

	renderer.setSize( dim, dim );
	renderer.setPixelRatio( 1 );

	renderer.clear();

	renderer.setRenderTarget( renderTarget );

	scene.overrideMaterial = Materials.getDepthMapMaterial( this );

	renderer.render( scene, rtCamera );

	scene.overrideMaterial = null;

	// correct height between entrances and terrain

	this.addHeightMap( renderer, renderTarget );

	this.checkTerrainShadingModes( renderer );

	// restore renderer to normal render size and target

	renderer.renderLists.dispose();

	// restore renderer to normal render size and target

	renderer.setRenderTarget( originalRenderTarget );

	renderer.setSize( container.clientWidth, container.clientHeight );
	renderer.setPixelRatio( window.devicePixelRatio );

};

CommonTerrain.prototype.setShadingMode = function ( mode, renderCallback ) {

	const activeOverlay = this.activeOverlay;

	var material;
	var hideAttribution = true;
	var overlay = null;

	switch ( mode ) {

	case SHADING_RELIEF:

		material = Materials.getHypsometricMaterial();

		break;

	case SHADING_OVERLAY:

		this.setOverlay( renderCallback );
		hideAttribution = false;

		break;

	case SHADING_CONTOURS:

		material = Materials.getContourMaterial();

		break;

	default:

		overlay = overlays[ mode ];

		if ( overlay !== undefined ) {

			if ( this.isTiled && overlay.hasCoverage ) {

				this.setOverlay( overlay, renderCallback );
				hideAttribution = false;

			} else {

				// if initial setting is not valid, default to shaded relief
				material = Materials.getHypsometricMaterial();
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

	if ( material !== undefined ) this.setMaterial( material );

	this.shadingMode = mode;

	return true;

};

CommonTerrain.prototype.setVisibility = function ( mode ) {

	if ( mode ) {

		this.showAttribution();

	} else {

		this.hideAttribution();

	}

};

CommonTerrain.prototype.showAttribution = function () {

	const attribution = this.screenAttribution;

	if ( attribution !== null ) {

		this.container.appendChild( attribution );

	}

	if ( this.activeOverlay !== null ) this.activeOverlay.showAttribution();

};

CommonTerrain.prototype.hideAttribution = function () {

	const attribution = this.screenAttribution;

	if ( attribution !== null ) {

		const parent = attribution.parentNode;

		if ( parent !== null ) parent.removeChild( attribution );


	}

	if ( this.activeOverlay !== null ) this.activeOverlay.hideAttribution();

};

CommonTerrain.prototype.applyDatumShift = function ( mode ) {

	if ( mode && this.activeDatumShift === 0 ) {

		this.translateZ( this.datumShift );
		this.activeDatumShift = this.datumShift;

	} else if ( ! mode && this.activeDatumShift !== 0 ) {

		this.translateZ( - this.datumShift );
		this.activeDatumShift = 0;

	}

	this.updateMatrix();

	this.dispatchEvent( { type: 'datumShiftChange', value: this.activeDatumShift } );

};

CommonTerrain.prototype.computeBoundingBox = function () {

	const bb = new Box3();

	this.traverse( _getBoundingBox );

	this.boundingBox = bb;

	function _getBoundingBox( obj ) {

		if ( obj.isTile ) bb.union( obj.geometry.boundingBox );

	}

	return bb;

};

CommonTerrain.prototype.addHeightMap = function ( renderer, renderTarget ) {

	this.depthTexture = renderTarget.texture;
	this.renderer = renderer;
	this.renderTarget = renderTarget;

};

CommonTerrain.prototype.getHeight = function ( point ) {

	const renderTarget = this.renderTarget;

	if ( this.terrainBase === null ) {

		if ( this.boundingBox === undefined ) this.computeBoundingBox();

		this.terrainBase = this.boundingBox.min;
		this.terrainRange = this.boundingBox.getSize( new Vector3() );

		// setup value cached

		__adjust.set( renderTarget.width, renderTarget.height, 1 ).divide( this.terrainRange );

	}

	const terrainBase = this.terrainBase;

	__vector3.copy( point ).sub( terrainBase ).multiply( __adjust ).round();

	this.renderer.readRenderTargetPixels( renderTarget, __vector3.x, __vector3.y, 1, 1, __result );

	// convert to survey units and return

	return unpackRGBA( __result ) * this.terrainRange.z + terrainBase.z;

};
CommonTerrain.prototype.setScale = function ( scale ) {

	CommonTerrainUniforms.scale.value = scale;

};

CommonTerrain.prototype.setAccuracy = function ( accuracy ) {

	CommonTerrainUniforms.accuracy.value = accuracy;
	CommonTerrainUniforms.ringColor.value.g = 1 - ( accuracy / 1000 );

};

CommonTerrain.prototype.setTarget = function ( target ) {

	CommonTerrainUniforms.target.value.copy( target );

};

export { CommonTerrain };

// EOF