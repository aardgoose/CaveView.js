
function CommonTerrain () {};

CommonTerrain.prototype.shadingMode;
CommonTerrain.prototype.opacity = 0.5;

CommonTerrain.prototype.getOpacity = function () {

	return this.opacity;

}

CommonTerrain.prototype.setShadingMode = function ( mode ) {

	var material;

	switch ( mode ) {

	case SHADING_HEIGHT:

		material = Materials.getHeightMaterial( MATERIAL_SURFACE );

		break;

	case SHADING_OVERLAY:

		if ( this.getOverlays() ) this.setOverlay( this.getOverlay() );

		break;

	case SHADING_CURSOR:

		 material = Materials.getCursorMaterial( MATERIAL_SURFACE, 5.0 );

		 break;

	case SHADING_SHADED:

		material = new THREE.MeshLambertMaterial( {
			color:        0xffffff,
			vertexColors: THREE.VertexColors,
			side:         THREE.FrontSide,
			transparent:  true,
			opacity:      this.opacity }
		);

		break;

	case SHADING_PW:

		material = new PWMaterial();

		break;

	default:

		console.log( "unknown mode", mode );
		return false;

	}

	if ( material !== undefined ) this.setMaterial( material );

	this.shadingMode = mode;

	return true;

}

export { CommonTerrain };

// EOF