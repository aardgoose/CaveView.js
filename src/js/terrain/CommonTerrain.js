"use strict";

var Cave = Cave || {};

CV.CommonTerrain = function () {};

CV.CommonTerrain.prototype.shadingMode;
CV.CommonTerrain.prototype.opacity = 0.5;

CV.CommonTerrain.prototype.getOpacity = function () {

	return this.opacity;

}

CV.CommonTerrain.prototype.setShadingMode = function ( mode ) {

	var material;

	switch ( mode ) {

	case CV.SHADING_HEIGHT:

		material = CV.Materials.getHeightMaterial( CV.MATERIAL_SURFACE );

		break;

	case CV.SHADING_OVERLAY:

		if ( this.getOverlays() ) this.setOverlay( this.getOverlay() );

		break;

	case CV.SHADING_CURSOR:

		 material = CV.Materials.getCursorMaterial( CV.MATERIAL_SURFACE, 5.0 );

		 break;

	case CV.SHADING_SHADED:

		material = new THREE.MeshLambertMaterial( {
			color:        0xffffff,
			vertexColors: THREE.VertexColors,
			side:         THREE.FrontSide,
			transparent:  true,
			opacity:      this.opacity }
		);

		break;

	case CV.SHADING_PW:

		material = new CV.PWMaterial();

		break;

	default:

		console.log( "unknown mode", mode );
		return false;

	}

	if ( material !== undefined ) this.setMaterial( material );

	this.shadingMode = mode;

	return true;

}