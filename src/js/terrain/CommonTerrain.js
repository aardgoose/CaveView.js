
import { MATERIAL_SURFACE, SHADING_CURSOR, SHADING_HEIGHT, SHADING_OVERLAY, SHADING_SHADED, SHADING_ASPECT } from '../core/constants';
import { Materials } from '../materials/Materials';

import {
	MeshLambertMaterial,
	VertexColors, FrontSide,
	Group
} from '../../../../three.js/src/Three';

function CommonTerrain () {

	Group.call( this );

	this.hasOverlay = false;
	this.defaultOverlay = null;
	this.activeOverlay = null;
	this.datumShift = 0;
	this.activeDatumShift = 0;

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

		console.log( 'unknown mode', mode );
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

export { CommonTerrain };

// EOF