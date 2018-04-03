import {
	VERSION, LEG_CAVE,
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE, STATION_ENTRANCE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_OVERLAY,
	SHADING_SINGLE, SHADING_SHADED, SHADING_SURVEY, SHADING_PATH, SHADING_DEPTH_CURSOR, SHADING_DISTANCE, SHADING_CONTOURS,
	SHADING_BECK, VIEW_NONE, VIEW_PLAN, VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_E, VIEW_ELEVATION_W,
} from '../core/constants';

import { replaceExtension, Cfg } from '../core/lib';
import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';
import { SurveyColours } from '../core/SurveyColours';

const guiState = {};

var caveList = [];
var routes = null;

var caveIndex = Infinity;
var surveyTree;
var currentTop;

var isCaveLoaded = false;
var fullscreenDiv;

var container;

var loadedFile;

var terrainControls = [];
var routeControls = [];

var terrainOverlay = null;

const legShadingModes = {
	'shading.height':        SHADING_HEIGHT,
	'shading.length':        SHADING_LENGTH,
	'shading.inclination':   SHADING_INCLINATION,
	'shading.height_cursor': SHADING_CURSOR,
	'shading.fixed':         SHADING_SINGLE,
	'shading.survey':        SHADING_SURVEY,
	'shading.route':         SHADING_PATH,
	'shading.distance':      SHADING_DISTANCE,
	'shading.back':          SHADING_BECK
};

const surfaceShadingModes = {
	'surface.shading.height':        SHADING_HEIGHT,
	'surface.shading.inclination':   SHADING_INCLINATION,
	'surface.shading.height_cursor': SHADING_CURSOR,
	'surface.shading.fixed':         SHADING_SINGLE
};

const terrainShadingModes = {
	'terrain.shading.relief': SHADING_SHADED,
	'terrain.shading.height': SHADING_HEIGHT
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
		set: function ( value ) { loadCave( value ); loadedFile = value; },
	} );

	Viewer.addEventListener( 'change', Page.handleChange );
	Viewer.addEventListener( 'change', handleChange );

	Viewer.addEventListener( 'newCave', viewComplete );

	// make sure we get new language strings if slow loading
	Cfg.addEventListener( 'change', refresh );

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

	case 'terrainShading': // eslint-disable-line no-fallthrough

		// only show overlay selection when terrain shading is set to overlay
		if ( Viewer.terrain && terrainOverlay && Viewer.terrainShading === SHADING_OVERLAY ) {

			terrainOverlay.style.display = 'block';

		} else if ( terrainOverlay ) {

			terrainOverlay.style.display = 'none';

		}

		break;

	}

}

function initSelectionPage () {

	const titleBar = document.createElement( 'div' );

	var depth = 0;
	var currentHover = 0;

	const stringCompare = new Intl.Collator( 'en-GB', { numeric: true } ).compare;

	currentTop = surveyTree;

	if ( ! isCaveLoaded ) return;

	const page = new Page( 'icon_explore', 'explore' );

	page.addHeader( 'Selection' );

	titleBar.id = 'ui-path';

	page.addListener( titleBar, 'click', _handleSelectTopSurvey );

	page.appendChild( titleBar );

	page.addSlide( _displayPanel( currentTop ), depth, _handleSelectSurvey );

	var redraw = container.clientHeight; // eslint-disable-line no-unused-vars

	page.addListener( Viewer, 'change', _handleChange );

	return;

	function _handleChange( event ) {

		if ( ! isCaveLoaded ) return;

		if ( event.name === 'section' || event.name === 'shadingMode' || event.name === 'splays' ) {

			page.replaceSlide( _displayPanel( currentTop ), depth, _handleSelectSurvey );

		}

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

			if ( child.hitCount === 0 && ! Viewer.splays && child.type !== STATION_ENTRANCE ) return; // skip spays if not displayed

			const li  = document.createElement( 'li' );
			const txt = document.createTextNode( child.name );
			const key = document.createElement( 'span' );

			li.id = 'sv' + child.id;

			if ( Viewer.section === child.id ) li.classList.add( 'selected' );

			if ( child.hitCount === undefined ) {

				let colour;

				if ( Viewer.shadingMode === SHADING_SURVEY && surveyColourMap[ child.id ] !== undefined ) {

					colour = surveyColourMap[ child.id ].getHexString();

				} else {

					colour = '444444';

				}

				key.style.color = '#' + colour;
				key.textContent = '\u2588 ';

			} else if ( child.type !== undefined && child.type === STATION_ENTRANCE ) {

				key.style.color = 'yellow';
				key.textContent = '\u2229 ';

			} else if ( child.hitCount > 2 ) { // station at junction

				key.style.color = 'yellow';
				key.textContent = '\u25fc ';

			} else if ( child.hitCount === 0 ) { // end of splay

				key.style.color = 'red';
				key.textContent = '\u25fb ';

			} else { // normal station in middle or end of leg

				key.style.color = 'red';
				key.textContent = '\u25fc ';

			}

			li.appendChild( key );
			li.appendChild( txt );

			if ( child.children.length > 0 ) {

				const descend = document.createElement( 'div' );

				descend.classList.add( 'descend-tree' );
				descend.id = 'ssv' + child.id;
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

		page.replaceSlide( _displayPanel( currentTop.parent ), --depth, _handleSelectSurvey );

	}

	function _handleSelectTopSurvey ( /* event */ ) {

		Viewer.section = currentTop.id;

	}

	function _handleSelectSurvey ( event ) {

		const target = event.target;
		const id = Number( target.id.split( 'v' )[ 1 ] );

		event.stopPropagation();

		switch ( target.nodeName ) {

		case 'LI':

			Viewer.section = ( Viewer.section !== id ) ? id : 0;
			Viewer.setPOI = true;

			break;

		case 'DIV':

			if ( id ) page.replaceSlide( _displayPanel( currentTop.findById( id ) ), ++depth, _handleSelectSurvey );

			break;

		}

	}

}

function initRoutePage () {

	const page = new Page( 'icon_route', 'routes', _onTop, _onLeave );

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

	_addKey( '[', 'shading.cursor_up' );
	_addKey( ']', 'shading.cursor_down' );

	help.appendChild( dl );

	help.addHeader( 'view.header' );

	dl = document.createElement( 'dl' );

	_addKey( 'F', 'view.full_screen' );
	_addKey( 'O', 'view.orthogonal' );
	_addKey( 'P', 'view.perspective' );
	_addKey( 'R', 'view.reset' );
	_addKey( '.', 'view.center' );

	if ( caveList.length > 0 ) _addKey( 'n', 'view.next' );

	help.appendChild( dl );

	help.addHeader( 'visibility.header' );

	dl = document.createElement( 'dl' );

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

	help.appendChild( dl );

	help.addHeader( 'selection.header' );

	dl = document.createElement( 'dl' );

	_addKey( 'V', 'selection.remove' );

	help.appendChild( dl );

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

	if ( Viewer.hasTerrain ) {

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
	if ( Viewer.hasAlpha         ) page.addCheckbox( 'visibility.alpha', Viewer, 'alpha' );
	if ( Viewer.hasScraps        ) page.addCheckbox( 'visibility.scraps', Viewer, 'scraps' );
	if ( Viewer.hasTraces        ) page.addCheckbox( 'visibility.traces', Viewer, 'traces' );

	page.addCheckbox( 'visibility.fog', Viewer, 'fog' );
	page.addCheckbox( 'visibility.hud', Viewer, 'HUD' );
	page.addCheckbox( 'visibility.box', Viewer, 'box' );

}

function initSurfacePage () {

	// reset
	terrainOverlay = null;
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

		const overlays = Viewer.terrainOverlays;
		const terrainShadingModesActive = Object.assign( {}, terrainShadingModes );

		if ( overlays.length > 0 ) terrainShadingModesActive[ 'terrain.shading.overlay' ] = SHADING_OVERLAY;
		if ( Viewer.hasContours ) terrainShadingModesActive[ 'terrain.shading.contours' + ' (' + Cfg.themeValue( 'shading.contours.interval' ) + '\u202fm)' ] = SHADING_CONTOURS;

		terrainControls.push( page.addSelect( 'terrain.shading.caption', terrainShadingModesActive, Viewer, 'terrainShading' ) );

		if ( overlays.length > 1 ) {

			terrainOverlay = page.addSelect( 'terrain.overlay.caption', overlays, Viewer, 'terrainOverlay' );
			terrainControls.push( terrainOverlay );

		}

		terrainControls.push( page.addRange( 'terrain.opacity', Viewer, 'terrainOpacity' ) );

		terrainControls.push( page.addCheckbox( 'terrain.datum_shift', Viewer, 'terrainDatumShift' ) );

		setControlsVisibility( terrainControls, false );

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

		surveyTree = null;

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

	// display shading mode and initialize

	surveyTree = Viewer.getSurveyTree();
	routes = Viewer.getRoutes();

	isCaveLoaded = true;

	initUI();

}

function toggleFullScreen() {

	Viewer.fullscreen = ! Viewer.fullscreen;

	setFullscreenUI ( fullscreenDiv );

}

function keyDown ( event ) {

	if ( ! isCaveLoaded ) return;

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

	case 65: // toggle alpha wall visibility - 'a'

		if ( Viewer.hasAlpha ) Viewer.alpha = ! Viewer.alpha;

		break;

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

	case 83: // switch view to perspective - 's'

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

	case 107: // increase cursor depth - '+' (keypad)
	case 219: // '[' key

		Viewer.cursorHeight++;

		break;

	case 109: // decrease cursor depth - '-' (keypad)
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

// export public interface

export const UI = {
	init:         init,
	loadCave:     loadCave,
	loadCaveList: loadCaveList
};


// EOF