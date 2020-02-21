import {
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE, CAMERA_ANAGLYPH, CAMERA_STEREO,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH,
	SHADING_SINGLE, SHADING_SURVEY, SHADING_PATH, SHADING_DEPTH_CURSOR, SHADING_DISTANCE,
	/* SHADING_BECK, */ VIEW_NONE, VIEW_PLAN, VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_E, VIEW_ELEVATION_W
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
//	'shading.back':          SHADING_BECK
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
//	'view.camera.stereo':       CAMERA_STEREO
};

function SettingsPage ( frame, viewer, fileSelector ) {

	Page.call( this, 'icon_settings', 'settings' );

	frame.addPage( this );

	const controls = [];
	const routeControls = [];

	const legShadingModesActive = Object.assign( {}, legShadingModes );

	const routeNames = viewer.routeNames;

	if ( viewer.hasRealTerrain ) {

		legShadingModesActive[ 'shading.depth' ] = SHADING_DEPTH;
		legShadingModesActive[ 'shading.depth_cursor' ] = SHADING_DEPTH_CURSOR;

	}

	this.addHeader( 'survey.header' );

	if ( fileSelector.fileCount > 1 ) {

		this.addFileSelect( 'survey.caption', fileSelector.fileList, fileSelector, 'file' );

	} else {

		this.addLine( fileSelector.selectedFile );

	}

	this.addHeader( 'view.header' );

	this.addSelect( 'view.camera.caption', cameraModes, viewer, 'cameraType' );

	//	controls.push( this.addRange( 'view.eye_separation', viewer, 'eyeSeparation' ) );

	this.addSelect( 'view.viewpoints.caption', cameraViews, viewer, 'view' );

	this.addRange( 'view.vertical_scaling', viewer, 'zScale' );

	this.addCheckbox( 'view.autorotate', viewer, 'autoRotate' );

	this.addRange( 'view.rotation_speed', viewer, 'autoRotateSpeed' );

	this.addHeader( 'shading.header' );

	this.addSelect( 'shading.caption', legShadingModesActive, viewer, 'shadingMode' );

	if ( routeNames.length !== 0 ) {

		if ( ! viewer.route ) viewer.route = routeNames[ 0 ];

		routeControls.push( this.addSelect( 'selected_route', routeNames, viewer, 'route' ) );

	} else {

		routeControls.push( this.addText( this.i18n( 'no_routes') ) );

	}

	this.addHeader( 'visibility.header' );

	if ( viewer.hasEntrances       ) this.addCheckbox( 'visibility.entrances', viewer, 'entrances' );
	if ( viewer.hasStations        ) this.addCheckbox( 'visibility.stations', viewer, 'stations' );
	if ( viewer.hasStationLabels   ) this.addCheckbox( 'visibility.labels', viewer, 'stationLabels' );
	if ( viewer.hasStationComments ) this.addCheckbox( 'visibility.comments', viewer, 'stationComments' );
	if ( viewer.hasSplays          ) this.addCheckbox( 'visibility.splays', viewer, 'splays' );
	if ( viewer.hasWalls           ) this.addCheckbox( 'visibility.walls', viewer, 'walls' );
	if ( viewer.hasScraps          ) this.addCheckbox( 'visibility.scraps', viewer, 'scraps' );
	if ( viewer.hasTraces          ) this.addCheckbox( 'visibility.traces', viewer, 'traces' );

	this.addCheckbox( 'visibility.fog', viewer, 'fog' );
	this.addCheckbox( 'visibility.hud', viewer, 'HUD' );
	this.addCheckbox( 'visibility.box', viewer, 'box' );

	if ( viewer.hasWarnings ) this.addCheckbox( 'visibility.warnings', viewer, 'warnings' );

	this.addHeader( 'controls.header' );

	this.addCheckbox( 'controls.svx_control_mode', viewer, 'svxControlMode' );
	this.addCheckbox( 'controls.zoom_to_cursor', viewer, 'zoomToCursor' );

	if ( viewer.svxControlMode ) this.addCheckbox( 'controls.wheel_tilt', viewer, 'wheelTilt' );

	_onChange( { name: 'cameraType' } );
	_onChange( { name: 'shadingMode' } );

	this.onChange = _onChange;

	return this;

	function _onChange ( event ) {

		if ( event.name === 'shadingMode' ) {

			frame.setControlsVisibility( routeControls, ( viewer.shadingMode === SHADING_PATH ) );

		}

		// change UI dynamicly to only display useful controls
		if ( event.name === 'cameraType' ) {

			frame.setControlsVisibility( controls, viewer.cameraType === CAMERA_ANAGLYPH || viewer.cameraType === CAMERA_STEREO );

		}

	}

}

SettingsPage.prototype = Object.create( Page.prototype );

export { SettingsPage };