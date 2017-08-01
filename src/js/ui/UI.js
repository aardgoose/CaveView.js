import {
	VERSION,
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE, STATION_ENTRANCE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_OVERLAY,
	SHADING_SINGLE, SHADING_SHADED, SHADING_SURVEY, SHADING_PATH, SHADING_DEPTH_CURSOR,
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
var surveyTree;
var currentTop;

var isCaveLoaded = false;

var container;

var file;
var progressBar;

var terrainControls = [];
var routeControls = [];

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
	'by height':          SHADING_HEIGHT
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


	Viewer.addEventListener( 'change', Page.handleChange );
	Viewer.addEventListener( 'change', handleChange );

	Viewer.addEventListener( 'newCave', viewComplete );

}

function setControlsVisibility( list, visible ) {

	var display = visible ? 'block' : 'none';
	var element;

	for ( var i = 0, l = list.length; i < l; i++ ) {

		element = list[ i ];

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

	var titleBar = document.createElement( 'div' );
	var page;
	var depth = 0;
	var currentHover = 0;

	currentTop = surveyTree;

	if ( ! isCaveLoaded ) return;

	page = new Page( 'icon_explore' );

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

		var ul;
		var tmp;
		var span;

		var surveyColourMap = SurveyColours.getSurveyColourMap( surveyTree, Viewer.section );

		while ( tmp = titleBar.firstChild ) titleBar.removeChild( tmp ); // eslint-disable-line no-cond-assign

		if ( top.parent === null ) {

			titleBar.textContent = ( top.name === '' ) ? '[model]' : top.name;

		} else {

			span = document.createElement( 'span' );
			span.textContent = ' \u25C4';

			page.addListener( span, 'click', _handleSelectSurveyBack );

			titleBar.appendChild( span );
			titleBar.appendChild( document.createTextNode( ' ' + top.name ) );

		}

		ul = document.createElement( 'ul' );

		var children = top.children;

		// limit sorting to amounts that sort in reasonable time
		if  ( children.length < 1000 ) children.sort( _sortSurveys );

		// FIXME need to add listener to allow survey list to be updated on dynamic load of survey

		top.forEachChild( _addLine );

		currentTop = top;

		page.addListener( ul, 'mouseover', _handleMouseover );
		page.addListener( ul, 'mouseleave', _handleMouseleave );

		return ul;

		function _addLine ( child ) {

			if ( child.hitCount === 0 && ! Viewer.splays ) return; // skip spays if not displayed

			var li  = document.createElement( 'li' );
			var txt = document.createTextNode( child.name );
			var key = document.createElement( 'span' );

			li.id = 'sv' + child.id;

			if ( Viewer.section === child.id ) li.classList.add( 'selected' );

			if ( child.hitCount === undefined ) {

				var colour;

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
		Viewer.highlight = 0;

	}

	function _handleMouseover ( event ) {

		event.stopPropagation();

		var target = event.target;

		if ( target.nodeName !== 'LI' ) return;

		var id = Number( target.id.split( 'v' )[ 1 ] );

		if ( id !== currentHover ) {

			Viewer.highlight = ( Viewer.section !== id ) ? id : 0;
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

		Viewer.section = currentTop.id;

	}

	function _handleSelectSurvey ( event ) {

		var target = event.target;
		var id = Number( target.id.split( 'v' )[ 1 ] );

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

	var page = new Page( 'icon_route', _onTop );
	var routeSelector;
	var getNewRouteName;
	var routeNames = routes.getRouteNames();

	page.addHeader( 'Routes' );

	page.addCheckbox( 'Edit Routes', Viewer, 'routeEdit' );

	routeSelector = page.addSelect( 'Current Route', routeNames, routes, 'setRoute' );

	routeControls.push( page.addButton( 'Save', _saveRoute ) );

	routeControls.push( page.addTextBox( 'New Route', '---', function ( getter ) { getNewRouteName = getter; } ) );

	routeControls.push( page.addButton( 'Add', _newRoute ) );

	routeControls.push( page.addDownloadButton( 'Download', Viewer.getMetadata, replaceExtension( file, 'json' ) ) );

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
		Viewer.shadingMode = SHADING_PATH;

		// display first route if present

		if ( ! routes.setRoute && routeNames.length > 0 ) routes.setRoute = routeNames[ 0 ];

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
	_addKey( '7', 'route' );
	_addKey( '8', 'depth from surface' );
	_addKey( '9', 'depth cursor' );

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
	_addKey( 'J', 'station labels on/off' );
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

<<<<<<< HEAD
	page.addText( 'CaveView v1.1.2 - a work in progress 3d cave viewer for Survex (.3d) and Therion (.lox) models.' );
=======
	page.addText( 'CaveView v' + VERSION + ' - a work in progress 3d cave viewer for Survex (.3d) and Therion (.lox) models.' );
>>>>>>> dev

	page.addText( 'Requires a browser supporting WebGL (IE 11+ and most other recent browsers), no plugins required. Created using the THREE.js 3D library and chroma,js colour handling library.' );

}

function initSettingsPage () {

	// reset

	var legShadingModesActive = Object.assign( {}, legShadingModes );

	if ( Viewer.hasTerrain ) {

		legShadingModesActive[ 'depth' ] = SHADING_DEPTH;
		legShadingModesActive[ 'depth cursor' ] = SHADING_DEPTH_CURSOR;

	}

	var page = new Page( 'icon_settings' );

	page.addHeader( 'Survey' );

	if ( caveList.length > 0 ) page.addSelect( 'File', caveList, guiState, 'file' );

	page.addHeader( 'View' );

	page.addSelect( 'Camera Type', cameraModes, Viewer, 'cameraType' );
	page.addSelect( 'View', cameraViews, Viewer, 'view' );

	page.addRange( 'Vertical scaling', Viewer, 'zScale' );

	page.addCheckbox( 'Auto Rotate', Viewer, 'autoRotate' );

	page.addRange( 'Rotation Speed', Viewer, 'autoRotateSpeed' );

	page.addHeader( 'Shading' );

	page.addSelect( 'Underground Legs', legShadingModesActive, Viewer, 'shadingMode' );

	page.addHeader( 'Visibility' );

	if ( Viewer.hasEntrances     ) page.addCheckbox( 'Entrances', Viewer, 'entrances' );
	if ( Viewer.hasStations      ) page.addCheckbox( 'Stations', Viewer, 'stations' );
	if ( Viewer.hasStationLabels ) page.addCheckbox( 'Station Labels', Viewer, 'stationLabels' );
	if ( Viewer.hasSplays        ) page.addCheckbox( 'Splay Legs', Viewer, 'splays' );
	if ( Viewer.hasWalls         ) page.addCheckbox( 'Walls (LRUD)', Viewer, 'walls' );
	if ( Viewer.hasScraps        ) page.addCheckbox( 'Scraps', Viewer, 'scraps' );
	if ( Viewer.hasTraces        ) page.addCheckbox( 'Dye Traces', Viewer, 'traces' );

	page.addCheckbox( 'Indicators', Viewer, 'HUD' );
	page.addCheckbox( 'Bounding Box', Viewer, 'box' );

}

function initSurfacePage () {

	// reset
	terrainOverlay = null;
	terrainControls = [];

	var page = new Page( 'icon_terrain' );

	page.addHeader( 'Surface Features' );

	if ( Viewer.hasSurfaceLegs ) {

		page.addCheckbox( 'Surface Legs', Viewer, 'surfaceLegs' );
		page.addSelect( 'Leg Shading', surfaceShadingModes, Viewer, 'surfaceShading' );

	}

	if ( Viewer.hasTerrain ) {

		page.addHeader( 'Terrain' );

		page.addCheckbox( 'Terrain', Viewer, 'terrain' );

		var overlays = Viewer.terrainOverlays;
		var terrainShadingModesActive = Object.assign( {}, terrainShadingModes );

		if ( overlays.length > 0 ) terrainShadingModesActive[ 'map overlay' ] = SHADING_OVERLAY;

		terrainControls.push( page.addSelect( 'Shading', terrainShadingModesActive, Viewer, 'terrainShading' ) );

		if ( overlays.length > 1 ) {

			terrainOverlay = page.addSelect( 'Overlay', overlays, Viewer, 'terrainOverlay' );
			terrainControls.push( terrainOverlay );

		}

		terrainControls.push( page.addRange( 'Terrain opacity', Viewer, 'terrainOpacity' ) );

		terrainControls.push( page.addCheckbox( 'Vertical datum shift', Viewer, 'terrainDatumShift' ) );

		setControlsVisibility( terrainControls, false );

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

function loadCave ( inFile ) {

	file = inFile;

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

	Viewer.shadingMode = SHADING_HEIGHT;

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

	case 67: // toggle scraps visibility - 'c'

		if ( Viewer.hasScraps ) Viewer.scraps = ! Viewer.scraps;

		break;

	case 68: // toggle dye traces visibility - 'd'

		if ( Viewer.hasTraces ) Viewer.traces = ! Viewer.traces;

		break;

	case 73: // toggle entrance labels - 'i'

		Viewer.developerInfo = true;

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

export var UI = {
	init:         init,
	loadCave:     loadCave,
	loadCaveList: loadCaveList
};


// EOF