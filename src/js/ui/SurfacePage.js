import {
	LM_NONE, LM_SINGLE, LM_MULTIPLE, SHADING_CURSOR, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_SURFACE
} from '../core/constants';

import { Page } from './Page';

const surfaceShadingModes = {
	'surface.shading.height':        SHADING_HEIGHT,
	'surface.shading.inclination':   SHADING_INCLINATION,
	'surface.shading.height_cursor': SHADING_CURSOR,
	'surface.shading.fixed':         SHADING_SURFACE
};

const lightingModes = {
	'terrain.lightingmodes.none': LM_NONE,
	'terrain.lightingmodes.single': LM_SINGLE,
	'terrain.lightingmodes.multiple': LM_MULTIPLE
};

class SurfacePage extends Page {

	constructor ( frame, viewer ) {

		const controls = [];

		super( 'icon_terrain', 'surface' );

		frame.addPage ( this );

		this.addHeader( 'surface.header' );

		if ( viewer.hasSurfaceLegs ) {

			this.addCheckbox( 'surface.legs', viewer, 'surfaceLegs' );
			this.addSelect( 'surface.shading.caption', surfaceShadingModes, viewer, 'surfaceShading' );

		}

		if ( viewer.hasTerrain ) {

			this.addHeader( 'terrain.header' );

			this.addCheckbox( 'terrain.terrain', viewer, 'terrain' );

			controls.push( this.addSelect( 'terrain.shading.caption', viewer.terrainShadingModes, viewer, 'terrainShading' ) );

			controls.push( this.addRange( 'terrain.opacity', viewer, 'terrainOpacity' ) );

			controls.push( this.addCheckbox( 'terrain.datum_shift', viewer, 'terrainDatumShift' ) );
			controls.push( this.addSelect( 'terrain.lightingmode', lightingModes, viewer, 'terrainLightingMode' ) );

			if ( ! viewer.hasRealTerrain ) {

				controls.push( this.addDownloadButton( 'terrain.downloadTileSet', viewer.terrainTileSet, 'tileSetEntry.json' ) );

			}

			viewer.terrainAttributions.forEach( attribution => {

				this.addText( attribution );

			} );

		}

		_onChange( { name: 'terrain' } );

		this.onChange = _onChange;

		return this;

		function _onChange ( event ) {

			// change UI dynamicly to only display useful controls
			if ( event.name === 'terrain' ) {

				frame.setControlsVisibility( controls, viewer.terrain );

			}

		}

	}

}

export { SurfacePage };