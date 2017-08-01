
import { MATERIAL_SURFACE, SHADING_HEIGHT, SHADING_OVERLAY, SHADING_SHADED } from '../core/constants';
import { Materials } from '../materials/Materials';
import { unpackRGBA } from '../core/unpackRGBA';

import {
	MeshLambertMaterial,
	VertexColors, FrontSide,
	Group, Box3, Vector3
} from '../../../../three.js/src/Three';

function CommonTerrain () {

	Group.call( this );

	this.hasOverlay = false;
	this.defaultOverlay = null;
	this.activeOverlay = null;
	this.depthTexture = null;
	this.renderer = null;
	this.renderTarget = null;
	this.datumShift = 0;
	this.activeDatumShift = 0;
	this.terrainBase = null;
	this.terrainRange = null;

	this.addEventListener( 'removed', function removeTerrain() { this.removed(); } );

}

CommonTerrain.prototype = Object.create( Group.prototype );

CommonTerrain.prototype.constructor = CommonTerrain;

CommonTerrain.prototype.shadingMode = SHADING_SHADED;
CommonTerrain.prototype.opacity = 0.5;

CommonTerrain.prototype.removed = function () {};

CommonTerrain.prototype.getOpacity = function () {

	return this.opacity;

};

CommonTerrain.prototype.commonRemoved = function () {

	this.setVisibility( false ); // remove any overlay attribution

	if ( this.renderTarget !== null ) this.renderTarget.dispose();

};

CommonTerrain.prototype.setShadingMode = function ( mode, renderCallback ) {

	var material;
	var hideAttribution = true;

	switch ( mode ) {

	case SHADING_HEIGHT:

		material = Materials.getHeightMaterial( MATERIAL_SURFACE );

		break;

	case SHADING_OVERLAY:

		this.setOverlay( ( this.activeOverlay === null ? this.defaultOverlay : this.activeOverlay ), renderCallback );
		hideAttribution = false;

		break;

	case SHADING_SHADED:

		material = new MeshLambertMaterial( {
			color:        0xffffff,
			vertexColors: VertexColors,
			side:         FrontSide,
			transparent:  true,
			opacity:      this.opacity }
		);

		break;

	default:

		console.warn( 'unknown mode', mode );
		return false;

	}

	if ( hideAttribution && this.activeOverlay !== null ) {

		this.activeOverlay.hideAttribution();
		this.activeOverlay = null;

	}

	if ( material !== undefined ) this.setMaterial( material );

	this.shadingMode = mode;

	return true;

};

CommonTerrain.prototype.setVisibility = function ( mode ) {

	if ( this.activeOverlay === null ) return;

	if ( mode ) {

		this.activeOverlay.showAttribution();

	} else {

		this.activeOverlay.hideAttribution();

	}

};

CommonTerrain.prototype.applyDatumShift = function ( mode ) {

	if ( mode && this.activeDatumShift === 0 ) {

		this.translateZ( this.datumShift );
		this.activeDatumShift = this.datumShift;

	} else if ( ! mode && this.activeDatumShift !== 0 ) {

		this.translateZ( - this.datumShift );
		this.activeDatumShift = 0;

	}

	this.dispatchEvent( { type: 'datumShiftChange', value: this.activeDatumShift } );

};

CommonTerrain.prototype.computeBoundingBox = function () {

	var bb = new Box3();

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

CommonTerrain.prototype.getHeight = function () {

	var pixelCoords = new Vector3();
	var adjust = new Vector3();

	var result = new Uint8Array( 4 );

	return function getHeight( point ) {

		var renderTarget = this.renderTarget;

		if ( this.terrainBase === null ) {

			if ( this.boundingBox === undefined ) this.computeBoundingBox();

			this.terrainBase = this.boundingBox.min;
			this.terrainRange = this.boundingBox.getSize();

			// setup value cached in closure

			adjust.set( renderTarget.width, renderTarget.height, 1 ).divide( this.terrainRange );

		}

		var terrainBase = this.terrainBase;

		pixelCoords.copy( point ).sub( terrainBase ).multiply( adjust ).round();

		this.renderer.readRenderTargetPixels( renderTarget, pixelCoords.x, pixelCoords.y, 1, 1, result );

		// convert to survey units and return

		return unpackRGBA( result ) * this.terrainRange.z + terrainBase.z;

	};

} ();

export { CommonTerrain };

// EOF