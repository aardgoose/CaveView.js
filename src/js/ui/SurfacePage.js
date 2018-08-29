import { SHADING_CURSOR, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_SINGLE } from '../core/constants';

import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';

const surfaceShadingModes = {
	'surface.shading.height':        SHADING_HEIGHT,
	'surface.shading.inclination':   SHADING_INCLINATION,
	'surface.shading.height_cursor': SHADING_CURSOR,
	'surface.shading.fixed':         SHADING_SINGLE
};


function SurfacePage () {

	const controls = [];

	Page.call( this, 'icon_terrain', 'surface' );

	this.addHeader( 'surface.header' );

	if ( Viewer.hasSurfaceLegs ) {

		this.addCheckbox( 'surface.legs', Viewer, 'surfaceLegs' );
		this.addSelect( 'surface.shading.caption', surfaceShadingModes, Viewer, 'surfaceShading' );

	}

	if ( Viewer.hasTerrain ) {

		this.addHeader( 'terrain.header' );

		this.addCheckbox( 'terrain.terrain', Viewer, 'terrain' );

		controls.push( this.addSelect( 'terrain.shading.caption', Viewer.terrainShadingModes, Viewer, 'terrainShading' ) );

		controls.push( this.addRange( 'terrain.opacity', Viewer, 'terrainOpacity' ) );

		controls.push( this.addCheckbox( 'terrain.datum_shift', Viewer, 'terrainDatumShift' ) );

		const attributions = Viewer.terrainAttributions;

		for ( var i = 0; i < attributions.length; i++ ) {

			this.addText( attributions[ i ] );

		}

	}

	_onChange( { name: 'terrain' } );

	this.onChange = _onChange;

	return this;

	function _onChange ( event ) {

		// change UI dynamicly to only display useful controls
		if ( event.name === 'terrain' ) {

			Page.setControlsVisibility( controls, Viewer.terrain );

		}

	}

}

SurfacePage.prototype = Object.create( Page.prototype );

export { SurfacePage };


// EOF