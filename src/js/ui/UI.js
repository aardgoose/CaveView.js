import {
	VERSION, LEG_CAVE,
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE, STATION_ENTRANCE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH,
	SHADING_SINGLE, SHADING_SURVEY, SHADING_PATH, SHADING_DEPTH_CURSOR, SHADING_DISTANCE,
	/* SHADING_BECK, */ VIEW_NONE, VIEW_PLAN, VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_E, VIEW_ELEVATION_W
} from '../core/constants';

import { replaceExtension, Cfg } from '../core/lib';
import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';
import { SurveyColours } from '../core/SurveyColours';

const guiState = {};

var caveList = [];
var caveIndex = Infinity;

var isCaveLoaded = false;
var fullscreenDiv;

var container;

var loadedFile;

var terrainControls = [];
var routeControls = [];
var avenControls;

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

const surfaceShadingModes = {
	'surface.shading.height':        SHADING_HEIGHT,
	'surface.shading.inclination':   SHADING_INCLINATION,
	'surface.shading.height_cursor': SHADING_CURSOR,
	'surface.shading.fixed':         SHADING_SINGLE
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
	'view.camera.perspective':  CAMERA_PERSPECTIVE
};

function init ( domID, configuration ) { // public method

	container = document.getElementById( domID );

	if ( ! container ) {

		alert( 'No container DOM object [' + domID + '] available' );
		return;

	}

	// target with css for fullscreen on small screen devices
	container.classList.add( 'cv-container' );

	Viewer.init( domID, configuration );

	// event handlers
	document.addEventListener( 'keydown', keyDown );

	container.addEventListener( 'drop', handleDrop );
	container.addEventListener( 'dragover', handleDragover );

	Object.defineProperty( guiState, 'file', {
		get: function () { return loadedFile; },
		set: loadCave
	} );

	Viewer.addEventListener( 'change', Page.handleChange );
	Viewer.addEventListener( 'change', handleChange );

	Viewer.addEventListener( 'newCave', viewComplete );

	// make sure we get new language strings if slow loading
	Cfg.addEventListener( 'change', refresh );

	avenControls = Cfg.value( 'avenControls', true );

}

function refresh() {

	if ( isCaveLoaded ) {

		Page.clear();
		initUI();

	}

}

function setControlsVisibility( list, visible ) {

	const display = visible ? 'block' : 'none';

	for ( var i = 0, l = list.length; i < l; i++ ) {

		const element = list[ i ];

		if ( element === null ) continue;

		element.style.display = display;

	}

}

function handleChange ( event ) {

	// change UI dynamicly to only display useful controls
	switch ( event.name ) {

	case 'routeEdit':

		setControlsVisibility( routeControls, Viewer.routeEdit );

		break;

	case 'terrain':

		setControlsVisibility( terrainControls, Viewer.terrain );

		break;

	}

}

function initSelectionPage () {

	const titleBar = document.createElement( 'div' );
	const surveyTree = Viewer.getSurveyTree();

	var depth = 0;
	var currentHover = 0;
	var currentTop;

	const stringCompare = new Intl.Collator( 'en-GB', { numeric: true } ).compare;

	currentTop = surveyTree;

	if ( ! isCaveLoaded ) return;

	const page = new Page( 'icon_explore', 'explore' );

	page.addHeader( 'Selection' );

	titleBar.id = 'ui-path';

	page.addListener( titleBar, 'click', _handleSelectTopSurvey );

	page.appendChild( titleBar );

	const slide = page.addSlide( _displayPanel( currentTop ), depth );

	slide.addEventListener( 'click', _handleSelectSurveyClick );
	slide.addEventListener( 'dblclick', _handleSelectSurveyDblClick );

	var redraw = container.clientHeight; // eslint-disable-line no-unused-vars

	page.addListener( Viewer, 'change', _handleChange );

	return;

	function _handleChange( event ) {

		if ( ! isCaveLoaded ) return;

		if ( event.name === 'section' || event.name === 'shadingMode' || event.name === 'splays' ) {

			_replaceSlide( _displayPanel( currentTop ), depth );

		}

	}

	function _replaceSlide ( content, depth ) {

		const slide = page.replaceSlide( content, depth );

		slide.addEventListener( 'click', _handleSelectSurveyClick );
		slide.addEventListener( 'dblclick', _handleSelectSurveyDblClick );

	}

	function _displayPanel ( top ) {

		const surveyColourMap = SurveyColours.getSurveyColourMap( surveyTree, Viewer.section );

		var tmp;

		while ( tmp = titleBar.firstChild ) titleBar.removeChild( tmp ); // eslint-disable-line no-cond-assign

		if ( top === surveyTree ) {

			titleBar.textContent = ( top.name === '' ) ? '[model]' : top.name;

		} else {

			const span = document.createElement( 'span' );

			span.textContent = ' \u25C4';

			page.addListener( span, 'click', _handleSelectSurveyBack );

			titleBar.appendChild( span );
			titleBar.appendChild( document.createTextNode( ' ' + top.name ) );

		}

		const ul = document.createElement( 'ul' );

		const children = top.children;

		if ( ! children.sorted ) {

			children.sort( _sortSurveys );
			children.sorted = true;

		}

		// FIXME need to add listener to allow survey list to be updated on dynamic load of survey

		top.forEachChild( _addLine );

		currentTop = top;

		page.addListener( ul, 'mouseover', _handleMouseover );
		page.addListener( ul, 'mouseleave', _handleMouseleave );

		return ul;

		function _addLine ( child ) {

			const id = child.id;
			const connections = ( child.p === undefined ) ? null : child.p.connections;

			if ( connections === 0 && ! Viewer.splays && child.type !== STATION_ENTRANCE ) return; // skip spays if not displayed

			const li  = document.createElement( 'li' );
			const txt = document.createTextNode( child.name );
			const key = document.createElement( 'span' );

			li.id = 'sv' + id;

			if ( Viewer.section === id ) li.classList.add( 'selected' );

			if ( connections === null ) {

				let colour;

				if ( Viewer.shadingMode === SHADING_SURVEY && surveyColourMap[ id ] !== undefined ) {

					colour = surveyColourMap[ id ].getHexString();

				} else {

					colour = '444444';

				}

				key.style.color = '#' + colour;
				key.textContent = '\u2588 ';

				li.classList.add( 'section' );

			} else if ( child.type !== undefined && child.type === STATION_ENTRANCE ) {

				key.style.color = Cfg.themeColorCSS( 'stations.entrances.marker' );
				key.textContent = '\u2229 ';

			} else if ( connections > 2 ) { // station at junction

				key.style.color = Cfg.themeColorCSS( 'stations.junctions.marker' );
				key.textContent = '\u25fc ';

			} else if ( connections === 0 ) { // end of splay

				key.style.color = Cfg.themeColorCSS( 'stations.default.marker' );
				key.textContent = '\u25fb ';

			} else { // normal station in middle or end of leg

				key.style.color = Cfg.themeColorCSS( 'stations.default.marker' );
				key.textContent = '\u25fc ';

			}

			li.appendChild( key );
			li.appendChild( txt );

			if ( child.children.length > 0 ) {

				const descend = document.createElement( 'div' );

				descend.classList.add( 'descend-tree' );
				descend.id = 'ssv' + id;
				descend.textContent = '\u25bA';

				li.appendChild( descend );

			}

			ul.appendChild( li );

		}

		function _sortSurveys ( s1, s2 ) {

			return stringCompare( s1.name, s2.name );

		}

	}

	function _handleMouseleave ( event ) {

		event.stopPropagation();
		Viewer.highlight = 0;

	}

	function _handleMouseover ( event ) {

		event.stopPropagation();

		const target = event.target;

		if ( target.nodeName !== 'LI' ) return;

		const id = Number( target.id.split( 'v' )[ 1 ] );

		if ( id !== currentHover ) {

			Viewer.highlight = ( Viewer.section !== id ) ? id : 0;
			currentHover = id;

		}

		return false;

	}

	function _handleSelectSurveyBack ( event ) {

		event.stopPropagation();

		if ( currentTop === surveyTree ) return;

		_replaceSlide( _displayPanel( currentTop.parent ), --depth );

	}

	function _handleSelectTopSurvey ( /* event */ ) {

		Viewer.section = currentTop.id;

	}

	function _handleSelectSurveyClick ( event ) {

		const target = event.target;
		const id = Number( target.id.split( 'v' )[ 1 ] );

		event.stopPropagation();

		switch ( target.nodeName ) {

		case 'LI':

		// Viewer.section = ( Viewer.section !== id ) ? id : 0;
			Viewer.section = id;
			Viewer.setPOI = true;

			break;

		case 'DIV':

			if ( id ) {

				_replaceSlide( _displayPanel( currentTop.findById( id ) ), ++depth );

			}

			break;

		}

	}

	function _handleSelectSurveyDblClick ( event ) {

		const target = event.target;
		const id = Number( target.id.split( 'v' )[ 1 ] );

		if ( ! target.classList.contains( 'section' ) ) return;

		event.stopPropagation();

		if ( id !== 0 ) {

			Viewer.cut = true;
			resetUI();

		}

	}

}

function initRoutePage () {

	const page = new Page( 'icon_route', 'routes', _onTop, _onLeave );

	const routes = Viewer.getRoutes();
	const routeNames = routes.getRouteNames();

	var routeSelector;
	var getNewRouteName;
	var lastShadingMode;

	page.addHeader( 'routes.header' );

	page.addCheckbox( 'routes.edit', Viewer, 'routeEdit' );

	routeSelector = page.addSelect( 'routes.current', routeNames, routes, 'setRoute' );

	routeControls.push( page.addButton( 'routes.save', _saveRoute ) );

	routeControls.push( page.addTextBox( 'routes.new', '---', function ( getter ) { getNewRouteName = getter; } ) );

	routeControls.push( page.addButton( 'routes.add', _newRoute ) );

	routeControls.push( page.addDownloadButton( 'routes.download', Viewer.getMetadata, replaceExtension( loadedFile, 'json' ) ) );

	setControlsVisibility( routeControls, false );

	page.addListener( routes, 'changed', Page.handleChange );

	return;

	function _newRoute () {

		routes.addRoute( getNewRouteName() );

		// update selector

		routeSelector = page.addSelect( 'Current Route', routes.getRouteNames(), routes, 'setRoute', routeSelector );

	}

	function _saveRoute () {

		routes.saveCurrent();

	}

	function _onTop () {

		// when selecting route editing mode - select correct leg shading mode
		lastShadingMode = Viewer.shadingMode;
		Viewer.shadingMode = SHADING_PATH;

		// display first route if present

		if ( ! routes.setRoute && routeNames.length > 0 ) routes.setRoute = routeNames[ 0 ];

	}

	function _onLeave () {

		Viewer.shadingMode = lastShadingMode;

	}

}

function initHelpPage () {

	const help = new Page( 'icon_help', 'help' );
	var dl;

	help.addHeader( 'header' );

	help.addHeader( 'shading.header' );

	dl = document.createElement( 'dl' );

	_addKey( '1', 'shading.height' );
	_addKey( '2', 'shading.inclination' );
	_addKey( '3', 'shading.length' );
	_addKey( '4', 'shading.height_cursor' );
	_addKey( '5', 'shading.single' );
	_addKey( '6', 'shading.survey' );
	_addKey( '7', 'shading.route' );
	_addKey( '8', 'shading.depth' );
	_addKey( '9', 'shading.depth_cursor' );
	_addKey( '0', 'shading.distance' );

	if ( ! avenControls ) {

		_addKey( '[', 'shading.cursor_up' );
		_addKey( ']', 'shading.cursor_down' );

	}

	help.appendChild( dl );

	help.addHeader( 'view.header' );

	dl = document.createElement( 'dl' );

	if ( avenControls ) {

		_addKey( 'P', 'view.plan' );
		_addKey( 'L', 'view.elevation' );

		_addKey( '', '-' );

		_addKey( 'N', 'view.north' );
		_addKey( 'E', 'view.east' );
		_addKey( 'S', 'view.south' );
		_addKey( 'W', 'view.west' );

		_addKey( '', '-' );

		_addKey( 'C', 'view.rotate_clockwise' );
		_addKey( 'V', 'view.rotate_anticlockwise' );

		_addKey( ']', 'view.zoom_in' );
		_addKey( '[', 'view.zoom_out' );

		_addKey( 'F', 'view.full_screen' );

		_addKey( '', '-' );

		_addKey( '" "', 'view.auto_rotate' );
		_addKey( 'Z', 'view.rotate_speed_up', avenControls );
		_addKey( 'V', 'view.rotate_speed_down', avenControls );
		_addKey( 'R', 'view.reverse_rotation', avenControls );

		_addKey( '', '-', avenControls );

		_addKey( '<del>', 'view.reset', avenControls );

	} else {

		_addKey( 'F', 'view.full_screen' );
		_addKey( 'O', 'view.orthogonal' );
		_addKey( 'P', 'view.perspective' );
		_addKey( 'R', 'view.reset' );
		_addKey( '.', 'view.center' );
		_addKey( 'N', 'view.next' );

	}

	help.appendChild( dl );

	help.addHeader( 'visibility.header' );

	dl = document.createElement( 'dl' );

	if ( avenControls ) {

		_addKey( 'J', 'visibility.station_labels' );
		_addKey( 'Q', 'visibility.splays' );
		_addKey( 'T', 'visibility.terrain' );
		_addKey( '<ctrl>N', 'visibility.station_labels' );
		_addKey( '<ctrl>X', 'visibility.stations' );
		_addKey( '<ctrl>L', 'visibility.survey' );
		_addKey( '<ctrl>F', 'visibility.surface' );

		_addKey( '', '-' );

		_addKey( '<', 'visibility.opacity_down' );
		_addKey( '>', 'visibility.opacity_up' );

	} else {

		_addKey( 'C', 'visibility.scraps' );
		_addKey( 'J', 'visibility.station_labels' );
		_addKey( 'L', 'visibility.entrance_labels' );
		_addKey( 'Q', 'visibility.splays' );
		_addKey( 'S', 'visibility.surface' );
		_addKey( 'T', 'visibility.terrain' );
		_addKey( 'W', 'visibility.walls' );
		_addKey( 'Z', 'visibility.stations' );

		_addKey( '', '-' );

		_addKey( '<', 'visibility.opacity_down' );
		_addKey( '>', 'visibility.opacity_up' );

	}

	help.appendChild( dl );

	if ( ! avenControls ) {

		help.addHeader( 'selection.header' );

		dl = document.createElement( 'dl' );

		_addKey( 'V', 'selection.remove' );

		help.appendChild( dl );

	}

	function _addKey( key, description ) {

		const dt = document.createElement( 'dt' );
		const dd = document.createElement( 'dd' );

		dt.textContent = key;
		dd.textContent = help.i18n( description );

		dl.appendChild( dt );
		dl.appendChild( dd );

	}

}

function initInfoPage () {

	const page = new Page( 'icon_info', 'info' );

	page.addHeader( 'header' );

	page.addHeader( 'stats.header' );

	const stats = Viewer.getLegStats ( LEG_CAVE );

	page.addLine( page.i18n( 'stats.legs' ) + ': ' + stats.legCount );
	page.addLine( page.i18n( 'stats.totalLength' ) + ': ' + stats.legLength.toFixed( 2 ) + '\u202fm' );
	page.addLine( page.i18n( 'stats.minLength' ) + ': ' + stats.minLegLength.toFixed( 2 ) + '\u202fm' );
	page.addLine( page.i18n( 'stats.maxLength' ) + ': ' + stats.maxLegLength.toFixed( 2 ) + '\u202fm' );

	page.addHeader( 'CaveView v' + VERSION + '.' );
	page.addText( 'A WebGL 3d cave viewer for Survex (.3d) and Therion (.lox) models.' );

	page.addText( 'For more information see: ' );
	page.addLink( 'https://aardgoose.github.io/CaveView.js/', 'CaveView on GitHub' );
	page.addText( '© Angus Sawyer, 2018' );

}

function initSettingsPage () {

	// reset

	const legShadingModesActive = Object.assign( {}, legShadingModes );

	if ( Viewer.hasRealTerrain ) {

		legShadingModesActive[ 'shading.depth' ] = SHADING_DEPTH;
		legShadingModesActive[ 'shading.depth_cursor' ] = SHADING_DEPTH_CURSOR;

	}

	const page = new Page( 'icon_settings', 'settings' );

	page.addHeader( 'survey.header' );

	if ( caveList.length > 0 ) page.addSelect( 'survey.caption', caveList, guiState, 'file' );

	page.addHeader( 'view.header' );

	page.addSelect( 'view.camera.caption', cameraModes, Viewer, 'cameraType' );
	page.addSelect( 'view.viewpoints.caption', cameraViews, Viewer, 'view' );

	page.addRange( 'view.vertical_scaling', Viewer, 'zScale' );

	page.addCheckbox( 'view.autorotate', Viewer, 'autoRotate' );

	page.addRange( 'view.rotation_speed', Viewer, 'autoRotateSpeed' );

	page.addHeader( 'shading.header' );

	page.addSelect( 'shading.caption', legShadingModesActive, Viewer, 'shadingMode' );

	page.addHeader( 'visibility.header' );

	if ( Viewer.hasEntrances     ) page.addCheckbox( 'visibility.entrances', Viewer, 'entrances' );
	if ( Viewer.hasStations      ) page.addCheckbox( 'visibility.stations', Viewer, 'stations' );
	if ( Viewer.hasStationLabels ) page.addCheckbox( 'visibility.labels', Viewer, 'stationLabels' );
	if ( Viewer.hasSplays        ) page.addCheckbox( 'visibility.splays', Viewer, 'splays' );
	if ( Viewer.hasWalls         ) page.addCheckbox( 'visibility.walls', Viewer, 'walls' );
	if ( Viewer.hasScraps        ) page.addCheckbox( 'visibility.scraps', Viewer, 'scraps' );
	if ( Viewer.hasTraces        ) page.addCheckbox( 'visibility.traces', Viewer, 'traces' );

	page.addCheckbox( 'visibility.fog', Viewer, 'fog' );
	page.addCheckbox( 'visibility.hud', Viewer, 'HUD' );
	page.addCheckbox( 'visibility.box', Viewer, 'box' );

}

function initSurfacePage () {

	// reset
	terrainControls = [];

	const page = new Page( 'icon_terrain', 'surface' );

	page.addHeader( 'surface.header' );

	if ( Viewer.hasSurfaceLegs ) {

		page.addCheckbox( 'surface.legs', Viewer, 'surfaceLegs' );
		page.addSelect( 'surface.shading.caption', surfaceShadingModes, Viewer, 'surfaceShading' );

	}

	if ( Viewer.hasTerrain ) {

		page.addHeader( 'terrain.header' );

		page.addCheckbox( 'terrain.terrain', Viewer, 'terrain' );

		terrainControls.push( page.addSelect( 'terrain.shading.caption', Viewer.terrainShadingModes, Viewer, 'terrainShading' ) );

		terrainControls.push( page.addRange( 'terrain.opacity', Viewer, 'terrainOpacity' ) );

		terrainControls.push( page.addCheckbox( 'terrain.datum_shift', Viewer, 'terrainDatumShift' ) );

		setControlsVisibility( terrainControls, Viewer.terrain );

		const attributions = Viewer.terrainAttributions;

		for ( var i = 0; i < attributions.length; i++ ) {

			page.addText( attributions[ i ] );

		}

	}

}

function initUI () {

	// create UI side panel and reveal tabs

	initSettingsPage();
	initSurfacePage();
	initSelectionPage();
	initRoutePage();
	initInfoPage();
	initHelpPage();

	Page.setParent( container );

	fullscreenDiv = Page.addTopButton( 'fullscreen', toggleFullScreen );

	setFullscreenUI ( fullscreenDiv );

}

function setFullscreenUI ( element ) {

	if ( Viewer.fullscreen ) {

		element.classList.remove( 'expand' );
		element.classList.add( 'collapse' );

	} else {

		element.classList.add( 'expand' );
		element.classList.remove( 'collapse' );

	}

}

function handleDragover ( event ) {

	event.preventDefault();
	event.dataTransfer.dropEffect = 'copy';

}

function handleDrop ( event ) {

	const dt = event.dataTransfer;

	event.preventDefault();

	if ( dt.files.length === 1 ) loadCave( dt.files[ 0 ], null );

}

function resetUI () {

	if ( isCaveLoaded ) {

		isCaveLoaded = false;

		Page.clear();

	}

}

function loadCaveList ( list ) {

	caveList = list;
	nextCave();

}

function nextCave () {

	//cycle through caves in list provided
	if ( caveList.length === 0 ) return false;

	if ( ++caveIndex >= caveList.length ) caveIndex = 0;

	guiState.file = caveList[ caveIndex ];

}

function loadCave ( file, section ) {

	resetUI();
	Viewer.clearView();

	Viewer.loadCave( file, section );
	loadedFile = file instanceof File ? file.name : file;

}

function viewComplete () {

	isCaveLoaded = true;

	initUI();

}

function toggleFullScreen() {

	Viewer.fullscreen = ! Viewer.fullscreen;

	setFullscreenUI ( fullscreenDiv );

}

function keyDown ( event ) {

	if ( ! isCaveLoaded ) return;

	if ( handleKeyCommon( event ) ) return;

	if ( avenControls ) {

		handleKeyAven( event );

	} else {

		handleKeyDefault( event );

	}

}

function handleKeyAven( event ) {

	if ( event.ctrlKey ) {

		switch ( event.keyCode ) {

		case 66: // '<ctrl>B'

			Viewer.box = ! Viewer.box;

			break;

		case 70: // '<ctrl>F'

			event.preventDefault();
			if ( Viewer.hasSurfaceLegs ) Viewer.surfaceLegs = ! Viewer.surfaceLegs;

			break;

		case 76: // '<ctrl>L'

			event.preventDefault();
			if ( Viewer.hasLegs ) Viewer.legs = ! Viewer.legs;

			break;

		case 78: // '<ctrl>N' (not available in Chrome)

			event.preventDefault();
			if ( Viewer.hasStationLabels ) Viewer.stationLabels = ! Viewer.stationLabels;

			break;

		case 88: // '<ctrl>X'

			Viewer.stations = ! Viewer.stations;
			break;

		}

	} else {

		switch ( event.keyCode ) {

		case 46: // '<delete>' reset view

			Viewer.autoRotate = false;
			Viewer.view = VIEW_PLAN;

			break;

		case 13:

			Viewer.autoRotate = true;

			break;

		case 32:

			Viewer.autoRotate = ! Viewer.autoRotate;

			break;

		case 76: // 'L' - plan

			Viewer.polarAngle = Math.PI / 2;

			break;

		case 69: // 'E' - East

			Viewer.azimuthAngle = 3 * Math.PI / 2;

			break;

		case 78: // 'N' - North

			Viewer.azimuthAngle = 0;

			break;

		case 80: // 'P' - plan

			Viewer.polarAngle = 0;

			break;

		case 82: // 'R' - reverse rotation direction

			Viewer.autoRotateSpeed *= -1;

			break;

		case 83: // 'S' - South

			Viewer.azimuthAngle = Math.PI;

			break;

		case 87: // 'W' - West

			Viewer.azimuthAngle = Math.PI / 2;

			break;

		case 88: // 'X' - decrease rotation speed

			Viewer.autoRotateSpeed -= 0.1;

			break;

		case 90: // 'Z' - increase rotation speed

			Viewer.autoRotateSpeed += 0.1;

			break;

		}

	}

}

function handleKeyDefault( event ) {

	if ( event.ctrlKey ) return;

	switch ( event.keyCode ) {

	case 67: // toggle scraps visibility - 'c'

		if ( Viewer.hasScraps ) Viewer.scraps = ! Viewer.scraps;

		break;

	case 68: // toggle dye traces visibility - 'd'

		if ( Viewer.hasTraces ) Viewer.traces = ! Viewer.traces;

		break;

	case 70: // toggle full screen - 'f'

		toggleFullScreen();

		break;

	case 74: // toggle entrance labels - 'j'

		if ( Viewer.hasStationLabels ) Viewer.stationLabels = ! Viewer.stationLabels;

		break;

	case 76: // toggle entrance labels - 'l'

		if ( Viewer.hasEntrances ) Viewer.entrances = ! Viewer.entrances;

		break;

	case 78: // load next cave in list - 'n'

		nextCave();

		break;

	case 79: // switch view to orthoganal - 'o'

		Viewer.cameraType = CAMERA_ORTHOGRAPHIC;

		break;

	case 80: // switch view to perspective -'p'

		Viewer.cameraType = CAMERA_PERSPECTIVE;

		break;

	case 81: // switch view to perspective -'q'

		if ( Viewer.hasSplays ) Viewer.splays = ! Viewer.splays;

		break;

	case 82: // reset camera positions and settings to initial plan view -'r'

		Viewer.view = VIEW_PLAN;

		break;

	case 83: // surface leg visibility - 's'

		if ( Viewer.hasSurfaceLegs ) Viewer.surfaceLegs = ! Viewer.surfaceLegs;

		break;

	case 84: // switch terrain on/off - 't'

		if ( Viewer.hasTerrain ) Viewer.terrain = ! Viewer.terrain;

		break;

	case 86: // cut selected survey section - 'v'

		resetUI();
		Viewer.cut = true;

		break;

	case 87: // switch walls on/off - 'w'

		if ( Viewer.hasWalls ) Viewer.walls = ! Viewer.walls;

		break;

	case 88: // look ast last POI - 'x'

		Viewer.setPOI = true; // actual value here is ignored.

		break;

	case 90: // show station markers - 'z'

		Viewer.stations = ! Viewer.stations;

		break;

	case 219: // '[' key

		Viewer.cursorHeight++;

		break;

	case 221: // ']' key

		Viewer.cursorHeight--;

		break;

	case 188: // decrease terrain opacity '<' key

		if ( Viewer.hasTerrain ) Viewer.terrainOpacity = Math.max( Viewer.terrainOpacity - 0.05, 0 );

		break;

	case 190: // increase terrain opacity '>' key

		if ( Viewer.hasTerrain ) Viewer.terrainOpacity = Math.min( Viewer.terrainOpacity + 0.05, 1 );

		break;

	}

}

function handleKeyCommon( event ) {

	if ( event.ctrlKey ) return false;

	var handled = true;

	switch ( event.keyCode ) {

	case 48: // change colouring scheme to distance = '0'

		Viewer.shadingMode = SHADING_DISTANCE;

		break;

	case 49: // change colouring scheme to depth - '1'

		Viewer.shadingMode = SHADING_HEIGHT;

		break;

	case 50: // change colouring scheme to angle - '2'

		Viewer.shadingMode = SHADING_INCLINATION;

		break;

	case 51: // change colouring scheme to length - '3'

		Viewer.shadingMode = SHADING_LENGTH;

		break;

	case 52: // change colouring scheme to height cursor - '4'

		Viewer.shadingMode = SHADING_CURSOR;

		break;

	case 53: // change colouring scheme to white - '5'

		Viewer.shadingMode = SHADING_SINGLE;

		break;

	case 54: // change colouring scheme to per survey section - '6'

		Viewer.shadingMode = SHADING_SURVEY;

		break;

	case 55: // change colouring scheme to per survey section - '7'

		Viewer.shadingMode = SHADING_PATH;

		break;

	case 56: // change colouring scheme to per survey section - '8'

		Viewer.shadingMode = SHADING_DEPTH;

		break;

	case 57: // change colouring scheme to depth - '9'

		Viewer.shadingMode = SHADING_DEPTH_CURSOR;

		break;

	case 70: // toggle full screen - 'f'

		toggleFullScreen();

		break;

	case 74: // toggle entrance labels - 'j'

		if ( Viewer.hasStationLabels ) Viewer.stationLabels = ! Viewer.stationLabels;

		break;

	case 79: // switch view to orthoganal - 'o'

		Viewer.cameraType = CAMERA_ORTHOGRAPHIC;

		break;

	case 81: // switch view to perspective -'q'

		if ( Viewer.hasSplays ) Viewer.splays = ! Viewer.splays;

		break;

	case 84: // switch terrain on/off - 't'

		if ( Viewer.hasTerrain ) Viewer.terrain = ! Viewer.terrain;

		break;

	case 107: // increase cursor depth - '+' (keypad)

		Viewer.cursorHeight++;

		break;

	case 109: // decrease cursor depth - '-' (keypad)

		Viewer.cursorHeight--;

		break;

	case 188: // decrease terrain opacity '<' key

		if ( Viewer.hasTerrain ) Viewer.terrainOpacity = Math.max( Viewer.terrainOpacity - 0.05, 0 );

		break;

	case 190: // increase terrain opacity '>' key

		if ( Viewer.hasTerrain ) Viewer.terrainOpacity = Math.min( Viewer.terrainOpacity + 0.05, 1 );

		break;

	default:

		handled = false;

	}

	return handled;

}

// export public interface

export const UI = {
	init:         init,
	loadCave:     loadCave,
	loadCaveList: loadCaveList
};


// EOF