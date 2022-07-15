import {
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE, CAMERA_ANAGLYPH,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH,
	SHADING_SINGLE, SHADING_SURVEY, SHADING_PATH, SHADING_DEPTH_CURSOR, SHADING_DISTANCE,
	VIEW_NONE, VIEW_PLAN, VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_E, VIEW_ELEVATION_W
} from '../core/constants';

import { Page } from './Page';

const legShadingModes = {
	'shading.height':        SHADING_HEIGHT,
	'shading.length':        SHADING_LENGTH,
	'shading.inclination':   SHADING_INCLINATION,
	'shading.height_cursor': SHADING_CURSOR,
	'shading.fixed':         SHADING_SINGLE,
	'shading.survey':        SHADING_SURVEY,
	'shading.route':         SHADING_PATH,
	'shading.distance':      SHADING_DISTANCE
};

const cameraViews = {
	'view.viewpoints.none':        VIEW_NONE,
	'view.viewpoints.plan':        VIEW_PLAN,
	'view.viewpoints.elevation_n': VIEW_ELEVATION_N,
	'view.viewpoints.elevation_s': VIEW_ELEVATION_S,
	'view.viewpoints.elevation_e': VIEW_ELEVATION_E,
	'view.viewpoints.elevation_w': VIEW_ELEVATION_W
};

const cameraModes = {
	'view.camera.orthographic': CAMERA_ORTHOGRAPHIC,
	'view.camera.perspective':  CAMERA_PERSPECTIVE,
	'view.camera.anaglyph':     CAMERA_ANAGLYPH
};

class SettingsPage extends Page {

	constructor ( frame, viewer, fileSelector ) {

		super( 'icon_settings', 'settings' );

		frame.addPage( this );

		const routeControls = [];
		const rotateControls = [];

		const cfg = viewer.ctx.cfg;

		const legShadingModesActive = Object.assign( {}, legShadingModes );

		this.addHeader( 'survey.header' );

		this.addFileSelect( 'survey.caption', fileSelector  );

		if ( ! viewer.surveyLoaded ) return this;

		const routeNames = viewer.routeNames;

		if ( viewer.hasRealTerrain ) {

			legShadingModesActive[ 'shading.depth' ] = SHADING_DEPTH;
			legShadingModesActive[ 'shading.depth_cursor' ] = SHADING_DEPTH_CURSOR;

		}

		const cvw = this.addCollapsingHeader( 'view.header' );

		cvw.appendChild( this.addSelect( 'view.camera.caption', cameraModes, viewer, 'cameraType' ) );

		//	controls.push( this.addRange( 'view.eye_separation', viewer, 'eyeSeparation' ) );

		cvw.appendChild( this.addSelect( 'view.viewpoints.caption', cameraViews, viewer, 'view' ) );

		cvw.appendChild( this.addRange( 'view.vertical_scaling', viewer, 'zScale' ) );

		cvw.appendChild( this.addRange( 'view.linewidth', viewer, 'linewidth' ) );
		// cvw.appendChild( this.addCheckbox( 'view.scaleLinewidth', viewer, 'scaleLinewidth' ) );
		cvw.appendChild( this.addCheckbox( 'view.autorotate', viewer, 'autoRotate' ) );

		rotateControls.push( cvw.appendChild( this.addRange( 'view.rotation_speed', viewer, 'autoRotateSpeed' ) ) );

		const sh = this.addCollapsingHeader( 'shading.header' );

		sh.appendChild( this.addSelect( 'shading.caption', legShadingModesActive, viewer, 'shadingMode' ) );

		if ( routeNames.length !== 0 ) {

			if ( ! viewer.route ) viewer.route = routeNames[ 0 ];

			routeControls.push( this.addSelect( 'selected_route', routeNames, viewer, 'route' ) );

		} else {

			routeControls.push( this.addText( this.i18n( 'no_routes') ) );

		}

		const cv = this.addCollapsingHeader( 'visibility.header' );

		if ( viewer.hasLegs            ) cv.appendChild( this.addCheckbox( 'visibility.legs', viewer, 'legs' ) );
		if ( viewer.hasEntrances       ) cv.appendChild( this.addCheckbox( 'visibility.entrances', viewer, 'entrances' ) );
		if ( viewer.hasEntrances       ) cv.appendChild( this.addCheckbox( 'visibility.entrance_dots', viewer, 'entrance_dots' ) );
		if ( viewer.hasStations        ) cv.appendChild( this.addCheckbox( 'visibility.stations', viewer, 'stations' ) );
		if ( viewer.hasStationLabels   ) cv.appendChild( this.addCheckbox( 'visibility.labels', viewer, 'stationLabels' ) );
		if ( viewer.hasStationComments ) cv.appendChild( this.addCheckbox( 'visibility.comments', viewer, 'stationComments' ) );
		if ( viewer.hasSplays          ) cv.appendChild( this.addCheckbox( 'visibility.splays', viewer, 'splays' ) );
		if ( viewer.hasWalls           ) cv.appendChild( this.addCheckbox( 'visibility.walls', viewer, 'walls' ) );
		if ( viewer.hasScraps          ) cv.appendChild( this.addCheckbox( 'visibility.scraps', viewer, 'scraps' ) );
		if ( viewer.hasDuplicateLegs   ) cv.appendChild( this.addCheckbox( 'visibility.duplicates', viewer, 'duplicateLegs' ) );
		if ( viewer.hasTraces          ) cv.appendChild( this.addCheckbox( 'visibility.traces', viewer, 'traces' ) );

		cv.appendChild( this.addCheckbox( 'visibility.fog', viewer, 'fog' ) );
		cv.appendChild( this.addCheckbox( 'visibility.hud', viewer, 'HUD' ) );
		cv.appendChild( this.addCheckbox( 'visibility.box', viewer, 'box' ) );
		cv.appendChild( this.addCheckbox( 'visibility.grid', viewer, 'grid' ) );

		if ( viewer.hasWarnings ) cv.appendChild( this.addCheckbox( 'visibility.warnings', viewer, 'warnings' ) );

		const ch = this.addCollapsingHeader( 'controls.header', true );

		ch.appendChild( this.addCheckbox( 'controls.svx_control_mode', viewer, 'svxControlMode' ) );
		ch.appendChild( this.addCheckbox( 'controls.zoom_to_cursor', viewer, 'zoomToCursor' ) );
		ch.appendChild( this.addCheckbox( 'ui.selection_tree', cfg, 'selectionTree' ) );

		const cs = this.addCollapsingHeader( 'default.header', true );

		cs.appendChild( this.addButton( 'default.save', () => viewer.saveView() ) );
		cs.appendChild( this.addButton( 'default.reset', () => viewer.resetView() ) );

		const cc = this.addCollapsingHeader( 'colors.header', true );

		cc.appendChild( this.addColor( 'colors.background_color', 'background' ) );
		cc.appendChild( this.addColor( 'colors.entrance_text', 'stations.entrances.text' ) );
		cc.appendChild( this.addColor( 'colors.entrance_background', 'stations.entrances.background' ) );
		cc.appendChild( this.addColor( 'colors.entrance_marker', 'stations.entrances.marker' ) );
		cc.appendChild( this.addColor( 'colors.bounding_box', 'box.bounding' ) );
		cc.appendChild( this.addColor( 'colors.legs_fixed', 'shading.single' ) );
		cc.appendChild( this.addColor( 'colors.surface_fixed', 'shading.surface' ) );
		cc.appendChild( this.addColor( 'colors.duplicate_fixed', 'shading.duplicate' ) );
		cc.appendChild( this.addColor( 'colors.hud_text', 'hud.text' ) );

		cc.appendChild( this.addButton( 'colors.defaults', cfg.resetColors.bind( cfg ) ) );

		if ( viewer.svxControlMode ) ch.appendChild( this.addCheckbox( 'controls.wheel_tilt', viewer, 'wheelTilt' ) );

		_onChange( { name: 'cameraType' } );
		_onChange( { name: 'shadingMode' } );
		_onChange( { name: 'autoRotate' } );

		this.onChange = _onChange;

		return this;

		function _onChange ( event ) {

			switch ( event.name ) {

			case 'shadingMode':

				frame.setControlsVisibility( routeControls, ( viewer.shadingMode === SHADING_PATH ) );
				break;

			case 'autoRotate':

				frame.setControlsVisibility( rotateControls, viewer.autoRotate );
				break;


			}

		}

	}

}

export { SettingsPage };