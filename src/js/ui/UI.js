import {
	CAMERA_ORTHOGRAPHIC,CAMERA_PERSPECTIVE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_OVERLAY, 
	SHADING_SINGLE, SHADING_SHADED, SHADING_SURVEY, SHADING_PATH, SHADING_ASPECT, SHADING_DEPTH_CURSOR,
	VIEW_NONE, VIEW_PLAN, VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_E, VIEW_ELEVATION_W,
} from '../core/constants';

import { replaceExtension } from '../core/lib';
import { Page } from './Page';
import { ProgressBar } from './ProgressBar';
import { CaveLoader } from '../loaders/CaveLoader';
import { Viewer } from '../viewer/Viewer';
import { SurveyColours } from '../core/SurveyColours';

var cave;
var caveLoader;
var routes = null;

var caveIndex = Infinity;
var caveList = [];
var guiState = {};
var viewState;
var surveyTree;

var isCaveLoaded = false;
var isRoutesLoaded = false;

var container;

var file;
var progressBar;

var terrainControls = [];
var terrainOverlay = null;

var legShadingModes = {
	'by height':          SHADING_HEIGHT,
	'by leg length':      SHADING_LENGTH,
	'by leg inclination': SHADING_INCLINATION,
	'height cursor':      SHADING_CURSOR,
	'fixed':              SHADING_SINGLE,
	'survey':             SHADING_SURVEY,
	'route':              SHADING_PATH
};

var surfaceShadingModes = {
	'by height':          SHADING_HEIGHT,
	'by leg inclination': SHADING_INCLINATION,
	'height cursor':      SHADING_CURSOR,
	'fixed':              SHADING_SINGLE
};

var terrainShadingModes = {
	'Relief shading':     SHADING_SHADED,
	'by height':          SHADING_HEIGHT,
	'height cursor':      SHADING_CURSOR,
	'aspect':             SHADING_ASPECT
};

var cameraViews = {
	'<select viewpoint>': VIEW_NONE,
	'Plan':               VIEW_PLAN,
	'N Elevation':        VIEW_ELEVATION_N,
	'S Elevation':        VIEW_ELEVATION_S,
	'E Elevation':        VIEW_ELEVATION_E,
	'W Elevation':        VIEW_ELEVATION_W
};

var cameraModes = {
	'Orthographic': CAMERA_ORTHOGRAPHIC,
	'Perspective':  CAMERA_PERSPECTIVE
};

function init ( domID, configuration ) { // public method

	container = document.getElementById( domID );

	if ( ! container ) {

		alert( 'No container DOM object [' + domID + '] available' );
		return;

	}

	progressBar = new ProgressBar( container );

	Viewer.init( domID, configuration );

	caveLoader = new CaveLoader( caveLoaded, progress );

	// event handlers
	document.addEventListener( 'keydown', keyDown );

	container.addEventListener( 'drop', handleDrop );
	container.addEventListener( 'dragover', handleDragover );

	Object.defineProperty( guiState, 'file', {
		get: function () { return file; },
		set: function ( value ) { loadCave( value ); file = value; },
	} );

	viewState = Viewer.getState;

	viewState.addEventListener( 'change', Page.handleChange );
	viewState.addEventListener( 'change', handleChange );

	viewState.addEventListener( 'newCave', viewComplete );

}

function handleChange ( event ) {

	var display;

	// change UI dynamicly to only display useful controls
	switch ( event.name ) {

	case 'terrain':

		// only show overlay selection when terrain shading is set to overlay
		display = viewState.terrain ? 'block' : 'none';

		for ( var i = 0, l = terrainControls.length; i < l; i++ ) {

			terrainControls[ i ].style.display = display;

		}

	case 'terrainShading': // eslint-disable-line no-fallthrough

		// only show overlay selection when terrain shading is set to overlay
		if ( viewState.terrain && terrainOverlay && viewState.terrainShading === SHADING_OVERLAY ) {

			terrainOverlay.style.display = 'block';

		} else if ( terrainOverlay ) {

			terrainOverlay.style.display = 'none';

		}
 
		break;

	}

}

function initSelectionPage () {

	var titleBar = document.createElement( 'div' );
	var page;
	var currentTop = surveyTree;
	var depth = 0;
	var currentHover = 0;

	if ( ! isCaveLoaded ) return;

	page = new Page( 'icon_explore' );

	page.addHeader( 'Selection' );

	titleBar.id = 'ui-path';
	titleBar.addEventListener( 'click', _handleSelectTopSurvey );

	page.appendChild( titleBar );

	page.addSlide( _displayPanel( currentTop ), depth, _handleSelectSurvey );

	var redraw = container.clientHeight; // eslint-disable-line no-unused-vars

	viewState.addEventListener( 'change', _handleChange );

	return;

	function _handleChange( event ) {

		if ( ! isCaveLoaded ) return;

		if ( event.name === 'section' || event.name === 'shadingMode' || event.name === 'splays' ) {

			page.replaceSlide( _displayPanel( currentTop ), depth, _handleSelectSurvey );

		}

	}

	function _displayPanel ( top ) {

		var ul;
		var tmp;
		var span;

		var surveyColourMap = SurveyColours.getSurveyColourMap( surveyTree, viewState.section );

		while ( tmp = titleBar.firstChild ) titleBar.removeChild( tmp ); // eslint-disable-line no-cond-assign

		if ( top.parent === null ) {

			titleBar.textContent = ( top.name === '' ) ? '[model]' : top.name;

		} else {

			span = document.createElement( 'span' );
			span.textContent = ' \u25C4';
			span.addEventListener( 'click', _handleSelectSurveyBack );

			titleBar.appendChild( span );
			titleBar.appendChild( document.createTextNode( ' ' + top.name ) );

		}

		ul = document.createElement( 'ul' );

		var children = top.children;

		children.sort( _sortSurveys );

		// FIXME need to add listener to allow survey list to be updated on dynamic load of survey

		top.forEachChild( _addLine );
	
		currentTop = top;

		ul.addEventListener( 'mouseover', _handleMouseover );
		ul.addEventListener( 'mouseleave', _handleMouseleave );

		return ul;

		function _addLine ( child ) {

			if ( child.hitCount === 0 && ! viewState.splays ) return; // skip spays if not displayed

			var li  = document.createElement( 'li' );
			var txt = document.createTextNode( child.name );
			var key = document.createElement( 'span' );

			li.id = 'sv' + child.id;

			if ( viewState.section === child.id ) li.classList.add( 'selected' );

			if ( child.hitCount === undefined ) {

				var colour;

				if ( viewState.shadingMode === SHADING_SURVEY && surveyColourMap[ child.id ] !== undefined ) {

					colour = surveyColourMap[ child.id ].getHexString();

				} else {

					colour = '444444';

				}

				key.style.color = '#' + colour;
				key.textContent = '\u2588 ';

			} else if ( child.hitCount > 2 ) {

				key.style.color = 'yellow';
				key.textContent = '\u25fc ';

			} else if ( child.hitCount === 0 ) {

				key.style.color = 'red';
				key.textContent = '\u25fb ';

			} else {

				key.style.color = 'red';
				key.textContent = '\u25fc ';

			}

			li.appendChild( key );
			li.appendChild( txt );

			if ( child.children.length > 0 ) {

				var descend = document.createElement( 'div' );

				descend.classList.add( 'descend-tree' );
				descend.id = 'ssv' + child.id;
				descend.textContent = '\u25bA';

				li.appendChild( descend );

			}

			ul.appendChild( li );

		}

		function _sortSurveys ( s1, s2 ) {

			return s1.name.localeCompare( s2.name, 'en-GB', { numeric: true } );

		}

	}

	function _handleMouseleave ( event ) {

		event.stopPropagation();
		viewState.highlight = 0;

	}

	function _handleMouseover ( event ) {

		event.stopPropagation();

		var target = event.target;

		if ( target.nodeName !== 'LI' ) return;

		var id = Number( target.id.split( 'v' )[ 1 ] );

		if ( id !== currentHover ) {

			viewState.highlight = ( viewState.section !== id ) ? id : 0;
			currentHover = id;

		}

		return false;

	}

	function _handleSelectSurveyBack ( event ) {

		event.stopPropagation();

		if ( currentTop.parent === null ) return;

		page.replaceSlide( _displayPanel( currentTop.parent ), --depth, _handleSelectSurvey );

	}

	function _handleSelectTopSurvey ( /* event */ ) {

		viewState.section = currentTop.id;

	}

	function _handleSelectSurvey ( event ) {

		var target = event.target;
		var id = Number( target.id.split( 'v' )[ 1 ] );

		event.stopPropagation();

		switch ( target.nodeName ) {

		case 'LI':

			viewState.section = ( viewState.section !== id ) ? id : 0;
			viewState.setPOI = true;

			break;

		case 'DIV':

			if ( id ) page.replaceSlide( _displayPanel( currentTop.findById( id ) ), ++depth, _handleSelectSurvey );

			break;

		}

	}

}

function initRoutePage () {

	var route = new Page( 'icon_route' );
	var routeSelect = false;

	route.addHeader( 'Routes' );

	route.addCheckbox( 'edit route', viewState, 'routeEdit' );

	if ( isRoutesLoaded ) {

		route.addSelect( 'routes', routes.getRouteNames(), routes );

	}

	var routeFile = replaceExtension( file, 'json' );

	route.addDownloadButton( 'Download', routes, 'download', routeFile );

	routes.addEventListener( 'changed', _routesChanged );
	routes.addEventListener( 'changed', Page.handleChange );

	function _routesChanged( /* event */ ) {

		if ( routeSelect ) return;

		routeSelect = true;
		route.addSelect( 'routes', routes.getRouteNames(), routes, 'setRoute' );

	}

}

function initHelpPage () {

	var help = new Page( 'icon_help' );
	var dl;

	help.addHeader( 'Help - key commands' );

	help.addHeader( 'Shading' );

	dl = document.createElement( 'dl' );

	_addKey( '1', 'height' );
	_addKey( '2', 'leg angle' );
	_addKey( '3', 'leg length' );
	_addKey( '4', 'height cursor ' );
	_addKey( '5', 'single colour' );
	_addKey( '6', 'survey section' );
	_addKey( '7', 'depth from surface' );
	_addKey( '8', 'depth cursor' );
	_addKey( '9', 'route' );

	_addKey( '[', 'move depth cursor up' );
	_addKey( ']', 'move depth cursor down' );

	if ( caveList.length > 0 ) _addKey( 'n', 'next cave' );

	help.appendChild( dl );

	help.addHeader( 'View' );

	dl = document.createElement( 'dl' );

	_addKey( 'O', 'orthogonal view' );
	_addKey( 'P', 'perspective view' );
	_addKey( 'R', 'reset to plan view' );
	_addKey( '.', 'center view on last feature selected' );

	help.appendChild( dl );

	help.addHeader( 'Visibility' );

	dl = document.createElement( 'dl' );

	_addKey( 'C', 'scraps on/off [lox only]' );
	_addKey( 'L', 'labels on/off' );
	_addKey( 'Q', 'splay legs on/off' );
	_addKey( 'S', 'surface legs on/off' );
	_addKey( 'T', 'terrain on/off' );
	_addKey( 'W', 'LRUD walls on/off' );
	_addKey( 'Z', 'stations on/off' );

	_addKey( '', '-' );

	_addKey( '<', 'Decrease terrain opacity' );
	_addKey( '>', 'Increase terrain opacity' );

	help.appendChild( dl );

	help.addHeader( 'Selection' );

	dl = document.createElement( 'dl' );

	_addKey( 'V', 'Remove all except selected section' );

	help.appendChild( dl );

	function _addKey( key, description ) {

		var dt = document.createElement( 'dt' );
		var dd = document.createElement( 'dd' );

		dt.textContent = key;
		dd.textContent = description;

		dl.appendChild( dt );
		dl.appendChild( dd );

	}

}

function initInfoPage () {

	var page = new Page( 'icon_info' );

	page.addHeader( 'Information' );

	page.addText( 'Viewer - a work in progress 3d cave viewer for Survex (.3d) and Therion (.lox) models.' );

	page.addText( 'Requires a browser supporting WebGL (IE 11+ and most other recent browsers), no plugins required. Created using the THREE.js 3D library and chroma,js colour handling library.' );

}

function initSettingsPage () {

	// reset

	var legShadingModesActive = Object.assign( {}, legShadingModes );

	if ( viewState.hasTerrain ) {

		legShadingModesActive[ 'depth' ] = SHADING_DEPTH;
		legShadingModesActive[ 'depth cursor' ] = SHADING_DEPTH_CURSOR;

	}

	var page = new Page( 'icon_settings' );

	page.addHeader( 'Survey' );

	if ( caveList.length > 0 ) page.addSelect( 'File', caveList, guiState, 'file' );

	page.addHeader( 'View' );

	page.addSelect( 'Camera Type', cameraModes, viewState, 'cameraType' );
	page.addSelect( 'View', cameraViews, viewState, 'view' );

	page.addRange( 'Vertical scaling', viewState, 'zScale' );

	page.addCheckbox( 'Auto Rotate', viewState, 'autoRotate' );

	page.addRange( 'Rotation Speed', viewState, 'autoRotateSpeed' );

	page.addHeader( 'Shading' );

	page.addSelect( 'Underground Legs', legShadingModesActive, viewState, 'shadingMode' );

	page.addHeader( 'Visibility' );

	if ( viewState.hasEntrances ) page.addCheckbox( 'Entrances', viewState, 'entrances' );

	page.addCheckbox( 'Stations', viewState, 'stations' );

	if ( viewState.hasSplays ) page.addCheckbox( 'Splay Legs', viewState, 'splays' );
	if ( viewState.hasWalls  ) page.addCheckbox( 'Walls (LRUD)', viewState, 'walls' );
	if ( viewState.hasScraps ) page.addCheckbox( 'Scraps', viewState, 'scraps' );
	if ( viewState.hasTraces ) page.addCheckbox( 'Dye Traces', viewState, 'traces' );

	page.addCheckbox( 'Indicators', viewState, 'HUD' );
	page.addCheckbox( 'Bounding Box', viewState, 'box' );

}

function initSurfacePage () {

	// reset
	terrainOverlay = null;
	terrainControls = [];

	var page = new Page( 'icon_terrain' );

	page.addHeader( 'Surface Features' );

	if ( viewState.hasSurfaceLegs ) {

		page.addCheckbox( 'Surface Legs', viewState, 'surfaceLegs' );
		page.addSelect( 'Leg Shading', surfaceShadingModes, viewState, 'surfaceShading' );

	}

	if ( viewState.hasTerrain ) {

		page.addHeader( 'Terrain' );

		page.addCheckbox( 'Terrain', viewState, 'terrain' );

		var overlays = viewState.terrainOverlays;
		var terrainShadingModesActive = Object.assign( {}, terrainShadingModes );

		if ( overlays.length > 0 ) terrainShadingModesActive[ 'map overlay' ] = SHADING_OVERLAY;

		terrainControls.push( page.addSelect( 'Shading', terrainShadingModesActive, viewState, 'terrainShading' ) );

		if ( overlays.length > 1 ) {

			terrainOverlay = page.addSelect( 'Overlay', overlays, viewState, 'terrainOverlay' );
			terrainControls.push( terrainOverlay );

		}

		terrainControls.push( page.addRange( 'Terrain opacity', viewState, 'terrainOpacity' ) );

		for ( var i = 0, l = terrainControls.length; i < l; i++ ) {

			terrainControls[ i ].style.display = 'none';

		}

	}

}

function initUI () {

	Page.reset();

	// create UI side panel and reveal tabs

	initSettingsPage();
	initSurfacePage();
	initSelectionPage();
	initRoutePage();
	initInfoPage();
	initHelpPage();

	container.appendChild( Page.frame );

}

function handleDragover ( event ) {

	event.preventDefault();
	event.dataTransfer.dropEffect = 'copy';

}

function handleDrop ( event ) {

	var dt = event.dataTransfer;

	event.preventDefault();

	if ( dt.files.length === 1 ) loadCaveLocalFile( dt.files[ 0 ] );

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

function loadCave ( file ) {

	resetUI();
	Viewer.clearView();

	progressBar.Start( 'Loading file ' + file + ' ...' );

	caveLoader.loadURL( file );

}

function loadCaveLocalFile ( file ) {

	resetUI();
	Viewer.clearView();

	progressBar.Start( 'Loading file ' + file.name + ' ...' );

	caveLoader.loadFile( file );

}

function progress ( pcent ) {

	progressBar.Update( pcent );

}

function caveLoaded ( inCave ) {

	cave = inCave;

	// slight delay to allow repaint to display 100%.
	setTimeout( _delayedTasks1, 100 );

	function _delayedTasks1 () {

		progressBar.End();
		progressBar.Start( 'Rendering...' );

		setTimeout( _delayedTasks2, 100 );

	}

	function _delayedTasks2 () {

		Viewer.loadCave( cave );
		progressBar.End();

		// viewComplete executed as 'newCave'' event handler
	}

}

function viewComplete () {

	// display shading mode and initialize

	viewState.shadingMode = SHADING_HEIGHT;

	surveyTree = Viewer.getSurveyTree();
	routes = Viewer.getRoutes();

	isCaveLoaded = true;

	cave = null; // drop reference to cave to free heap space

	initUI();

}

function keyDown ( event ) {

	if ( ! isCaveLoaded ) return;

	switch ( event.keyCode ) {

	case 49: // change colouring scheme to depth - '1'

		viewState.shadingMode = SHADING_HEIGHT;

		break;

	case 50: // change colouring scheme to angle - '2'

		viewState.shadingMode = SHADING_INCLINATION;

		break;

	case 51: // change colouring scheme to length - '3'

		viewState.shadingMode = SHADING_LENGTH;

		break;

	case 52: // change colouring scheme to height cursor - '4'

		viewState.shadingMode = SHADING_CURSOR;

		break;

	case 53: // change colouring scheme to white - '5'

		viewState.shadingMode = SHADING_SINGLE;

		break;

	case 54: // change colouring scheme to per survey section - '6'

		viewState.shadingMode = SHADING_SURVEY;

		break;

	case 55: // change colouring scheme to per survey section - '7'

		viewState.shadingMode = SHADING_DEPTH;

		break;

	case 56: // change colouring scheme to per survey section - '8'

		viewState.shadingMode = SHADING_DEPTH_CURSOR;

		break;

	case 57: // change colouring scheme to depth - '9'

		viewState.shadingMode = SHADING_PATH;

		break;

	case 67: // toggle scraps visibility - 'c'

		if ( viewState.hasScraps ) viewState.scraps = ! viewState.scraps;

		break;

	case 68: // toggle dye traces visibility - 'd'

		if ( viewState.hasTraces ) viewState.traces = ! viewState.traces;

		break;

	case 76: // toggle entrance labels - 'l'

		if ( viewState.hasEntrances ) viewState.entrances = ! viewState.entrances;

		break;

	case 78: // load next cave in list - 'n'

		nextCave();

		break;

	case 79: // switch view to orthoganal - 'o'

		viewState.cameraType = CAMERA_ORTHOGRAPHIC;

		break;

	case 80: // switch view to perspective -'p'

		viewState.cameraType = CAMERA_PERSPECTIVE;

		break;

	case 81: // switch view to perspective -'q'

		if ( viewState.hasSplays ) viewState.splays = ! viewState.splays;

		break;

	case 82: // reset camera positions and settings to initial plan view -'r'

		viewState.view = VIEW_PLAN;

		break;

	case 83: // switch view to perspective - 's'

		if ( viewState.hasSurfaceLegs ) viewState.surfaceLegs = ! viewState.surfaceLegs;

		break;

	case 84: // switch terrain on/off - 't'

		if ( viewState.hasTerrain ) viewState.terrain = ! viewState.terrain;

		break;

	case 86: // cut selected survey section - 'v'

		resetUI();
		viewState.cut = true;

		break;

	case 87: // switch walls on/off - 'w'

		if ( viewState.hasWalls ) viewState.walls = ! viewState.walls;

		break;

	case 88: // look ast last POI - 'x'

		viewState.setPOI = true; // actual value here is ignored.

		break;

	case 90: // show station markers - 'z'

		viewState.stations = ! viewState.stations;

		break;

	case 107: // increase cursor depth - '+' (keypad)
	case 219: // '[' key 

		viewState.cursorHeight++;

		break;

	case 109: // decrease cursor depth - '-' (keypad)
	case 221: // ']' key

		viewState.cursorHeight--;

		break;

	case 188: // decrease terrain opacity '<' key

		if ( viewState.hasTerrain ) viewState.terrainOpacity = Math.max( viewState.terrainOpacity - 0.05, 0 );

		break;

	case 190: // increase terrain opacity '>' key

		if ( viewState.hasTerrain ) viewState.terrainOpacity = Math.min( viewState.terrainOpacity + 0.05, 1 );

		break;

	}

}

// export public interface

export var UI = {
	init:         init,
	loadCave:     loadCave,
	loadCaveList: loadCaveList
};


// EOF