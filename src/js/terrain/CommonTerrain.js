
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

	this.addEventListener( 'removed', function removeTerrain() { this.removed(); } );

}

CommonTerrain.prototype = Object.create( Group.prototype );

CommonTerrain.prototype.constructor = CommonTerrain;

CommonTerrain.prototype.shadingMode;
CommonTerrain.prototype.opacity = 0.5;

CommonTerrain.prototype.removed = function () {};

CommonTerrain.prototype.getOpacity = function () {

	return this.opacity;

};

CommonTerrain.prototype.setShadingMode = function ( mode ) {

	var material;

	switch ( mode ) {

	case SHADING_HEIGHT:

		material = Materials.getHeightMaterial( MATERIAL_SURFACE );

		break;

	case SHADING_OVERLAY:

		this.setOverlay( this.activeOverlay );

		break;

	case SHADING_CURSOR:

		material = Materials.getCursorMaterial( MATERIAL_SURFACE, 5.0 );

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

	case SHADING_ASPECT:

		material = Materials.getAspectMaterial();

		break;

	default:

		console.log( 'unknown mode', mode );
		return false;

	}

	if ( material !== undefined ) this.setMaterial( material );

	this.shadingMode = mode;

	return true;

};

export { CommonTerrain };

// EOF