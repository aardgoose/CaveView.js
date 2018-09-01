import {
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE, CAMERA_ANAGLYPH, CAMERA_STEREO,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH,
	SHADING_SINGLE, SHADING_SURVEY, SHADING_PATH, SHADING_DEPTH_CURSOR, SHADING_DISTANCE,
	/* SHADING_BECK, */ VIEW_NONE, VIEW_PLAN, VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_E, VIEW_ELEVATION_W
} from '../core/constants';

import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';

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

function SettingsPage ( fileSelector ) {

	Page.call( this, 'icon_settings', 'settings' );

	const controls = [];
	const routeControls = [];

	const legShadingModesActive = Object.assign( {}, legShadingModes );

	const routes = Viewer.getRoutes();
	const routeNames = routes.getRouteNames();

	if ( Viewer.hasRealTerrain ) {

		legShadingModesActive[ 'shading.depth' ] = SHADING_DEPTH;
		legShadingModesActive[ 'shading.depth_cursor' ] = SHADING_DEPTH_CURSOR;

	}

	this.addHeader( 'survey.header' );

	if ( fileSelector.fileCount > 1 ) {

		this.addSelect( 'survey.caption', fileSelector.fileList, fileSelector, 'file' );

	} else {

		this.addLine( fileSelector.selectedFile );

	}

	this.addHeader( 'view.header' );

	this.addSelect( 'view.camera.caption', cameraModes, Viewer, 'cameraType' );

	//	controls.push( this.addRange( 'view.eye_separation', Viewer, 'eyeSeparation' ) );

	this.addSelect( 'view.viewpoints.caption', cameraViews, Viewer, 'view' );

	this.addRange( 'view.vertical_scaling', Viewer, 'zScale' );

	this.addCheckbox( 'view.autorotate', Viewer, 'autoRotate' );

	this.addRange( 'view.rotation_speed', Viewer, 'autoRotateSpeed' );

	this.addHeader( 'shading.header' );

	this.addSelect( 'shading.caption', legShadingModesActive, Viewer, 'shadingMode' );

	if ( routeNames.length !== 0 ) {

		if ( ! routes.setRoute ) routes.setRoute = routeNames[ 0 ];

		routeControls.push( this.addSelect( 'selected_route', routeNames, routes, 'setRoute' ) );

	} else {

		routeControls.push( this.addText( this.i18n( 'no_routes') ) );

	}

	this.addHeader( 'visibility.header' );

	if ( Viewer.hasEntrances     ) this.addCheckbox( 'visibility.entrances', Viewer, 'entrances' );
	if ( Viewer.hasStations      ) this.addCheckbox( 'visibility.stations', Viewer, 'stations' );
	if ( Viewer.hasStationLabels ) this.addCheckbox( 'visibility.labels', Viewer, 'stationLabels' );
	if ( Viewer.hasSplays        ) this.addCheckbox( 'visibility.splays', Viewer, 'splays' );
	if ( Viewer.hasWalls         ) this.addCheckbox( 'visibility.walls', Viewer, 'walls' );
	if ( Viewer.hasScraps        ) this.addCheckbox( 'visibility.scraps', Viewer, 'scraps' );
	if ( Viewer.hasTraces        ) this.addCheckbox( 'visibility.traces', Viewer, 'traces' );

	this.addCheckbox( 'visibility.fog', Viewer, 'fog' );
	this.addCheckbox( 'visibility.hud', Viewer, 'HUD' );
	this.addCheckbox( 'visibility.box', Viewer, 'box' );

	_onChange( { name: 'cameraType' } );
	_onChange( { name: 'shadingMode' } );

	this.onChange = _onChange;

	return this;

	function _onChange ( event ) {

		if ( event.name === 'shadingMode' ) {

			Page.setControlsVisibility( routeControls, ( Viewer.shadingMode === SHADING_PATH ) );

		}

		// change UI dynamicly to only display useful controls
		if ( event.name === 'cameraType' ) {

			Page.setControlsVisibility( controls, Viewer.cameraType === CAMERA_ANAGLYPH || Viewer.cameraType === CAMERA_STEREO );

		}

	}

}

SettingsPage.prototype = Object.create( Page.prototype );

export { SettingsPage };


// EOF