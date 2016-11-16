import {
	CAMERA_ORTHOGRAPHIC,CAMERA_PERSPECTIVE, 
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_OVERLAY, SHADING_PW, SHADING_SINGLE, SHADING_SHADED, SHADING_SURVEY, SHADING_PATH,
	VIEW_NONE, VIEW_PLAN, VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_E, VIEW_ELEVATION_W
} from '../core/constants.js';

import { Colours } from '../core/Colours.js';
import { Page } from './Page.js';
import { ProgressBar } from './ProgressBar.js';
import { CaveLoader } from '../loaders/CaveLoader.js';

import { Viewer } from '../viewer/Viewer.js';
import { Routes } from '../viewer/Routes.js';

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

var heightCursorGui;
var file;
var progressBar;

var terrainControls = [];
var terrainOverlay = null;

var legShadingModes = {
	"by height":          SHADING_HEIGHT,
	"by leg length":      SHADING_LENGTH,
	"by leg inclination": SHADING_INCLINATION,
	"height cursor":      SHADING_CURSOR,
	"fixed":              SHADING_SINGLE,
	"survey":             SHADING_SURVEY
}

var surfaceShadingModes = {
	"by height":          SHADING_HEIGHT,
	"by leg inclination": SHADING_INCLINATION,
	"height cursor":      SHADING_CURSOR,
	"fixed":              SHADING_SINGLE
}

var terrainShadingModes = {
	"Relief shading":     SHADING_SHADED,
	"by height":          SHADING_HEIGHT,
	"height cursor":      SHADING_CURSOR
}

var cameraViews = {
	"<select viewpoint>": VIEW_NONE,
	"Plan":               VIEW_PLAN,
	"N Elevation":        VIEW_ELEVATION_N,
	"S Elevation":        VIEW_ELEVATION_S,
	"E Elevation":        VIEW_ELEVATION_E,
	"W Elevation":        VIEW_ELEVATION_W
}

var cameraModes = {
	"Orthographic": CAMERA_ORTHOGRAPHIC,
	"Perspective":  CAMERA_PERSPECTIVE
}

function init ( domID ) { // public method

	container = document.getElementById( domID );

	if ( ! container ) {

		alert( "No container DOM object [" + domID + "] available" );
		return;

	}

	progressBar = new ProgressBar( container );

	Viewer.init( domID );

	caveLoader = new CaveLoader( caveLoaded, progress );

	// event handlers
	document.addEventListener( "keydown", function ( event ) { keyDown( event ); } );

	container.addEventListener( "drop", handleDrop );
	container.addEventListener( "dragover", handleDragover );

	Object.defineProperty( guiState, "file", {
		get: function ()  { return file; },
		set: function ( value ) { loadCave( value ); file = value; },
	} );

	viewState = Viewer.getState;

	viewState.addEventListener( "change",  Page.handleChange );
	viewState.addEventListener( "change",  handleChange );
	viewState.addEventListener( "newCave", viewComplete );

}

function handleChange( event ) {

	var display;

	// change UI dynamicly to only display useful controls
	switch ( event.name ) {

	case "terrain":

		// only show overlay selection when terrain shading is set to overlay
		display = ( viewState.terrain ? "block" : "none" );

		for ( var i = 0, l = terrainControls.length; i < l; i++ ) {

			terrainControls[ i ].style.display = display;

		}

		// drop through here is deliberate. Do not add "break"

	case "terrainShading":

		// only show overlay selection when terrain shading is set to overlay
		if ( viewState.terrain && terrainOverlay && viewState.terrainShading === SHADING_OVERLAY ) {

			terrainOverlay.style.display = "block";

		} else if ( terrainOverlay ) {

			terrainOverlay.style.display = "none";

		}
 
		break;

	}

}

function initSelectionPage () {

	var titleBar  = document.createElement( "div" )
	var rootId    = surveyTree.id;
	var track     = [];
	var lastSelected  = false;
	var page;

	if ( ! isCaveLoaded ) return;

	page = new Page( "icon_explore" );

	page.addHeader( "Selection" );

	titleBar.id = "ui-path";
	titleBar.addEventListener( "click", _handleSelectSurveyBack );

	page.appendChild( titleBar );

	page.addSlide( _displayPanel( rootId ), track.length, _handleSelectSurvey );

	var redraw = container.clientHeight;

	return;

	function _displayPanel ( id ) {

		var top = surveyTree.findById( id );

		var ul;
		var tmp;
		var i;
		var l;
		var surveyColours      = Colours.surveyColoursCSS;
		var surveyColoursRange = surveyColours.length;
		var span;

		track.push( { name: top.name, id: id } );

		while ( tmp = titleBar.firstChild ) titleBar.removeChild( tmp );

		l = track.length;
		var footprint = track[ l - 1 ];

		titleBar.textContent = footprint.name;;

		if ( l > 1) {

			span = document.createElement( "span" );
			span.textContent = " \u25C4";

			titleBar.appendChild( span );

		}

		ul = document.createElement( "ul" );

		var children = top.children;

		children.sort( _sortSurveys );

		// FIXME need to add listener to allow survey list to be updated on dynamic load of survey

		top.forEachChild( _addLine );
	
		return ul;

		function _addLine( child ) {

			var li  = document.createElement( "li" );
			var txt = document.createTextNode( child.name );

			li.id = "sv" + child.id;
			
			var key = document.createElement( "span" );

			key.style.color = surveyColours[ child.id % surveyColoursRange ];
			key.textContent = "\u2588 ";

			li.appendChild( key );
			li.appendChild( txt );

			if ( child.children.length > 0 ) {

				var descend = document.createElement( "div" );

				descend.classList.add( "descend-tree" );
				descend.id = "ssv" + child.id;
				descend.textContent = "\u25bA";

				li.appendChild( descend );

			}

			ul.appendChild( li );

		}

		function _sortSurveys ( s1, s2 ) {

			return s1.name.localeCompare( s2.name );

		}

	}

	function _handleSelectSurveyBack ( event ) {

		if ( track.length === 1 ) return;

		track.pop();

		var id = track.pop().id;

		page.replaceSlide( _displayPanel( id ), track.length, _handleSelectSurvey );

	}

	function _handleSelectSurvey ( event ) {

		var target = event.target;
		var id = target.id.split( "v" )[ 1 ];

		event.stopPropagation();

		switch ( target.nodeName ) {

		case "LI":

			if ( viewState.section !== Number( id ) ) {

				viewState.section = id;

				target.classList.add( "selected" );

				if ( lastSelected && lastSelected !== target ) {

					lastSelected.classList.remove( "selected" );

				}

				lastSelected = target;

			} else {

				viewState.section = 0;
				target.classList.remove( "selected" );

			}

			break;

		case "DIV":

			// FIXME - detect entries with no children.....

			if ( id ) {

				page.replaceSlide( _displayPanel( id ), track.length, _handleSelectSurvey );

			}

			break;

		}

	}

}

function initRoutePage () {

	var route = new Page( "icon_route" );

	route.addHeader( "Routes" );

	if ( isRoutesLoaded ) {

		route.addSelect( "routes", routes.getRouteNames(), routes );

	}

	var routeFile = file.split( "." ).shift() + ".json";

	route.addDownloadButton( "Download", routeFile, routes.toDownload() );

}

function initHelpPage () {

	var help = new Page( "icon_help" );
	var dl;

	help.addHeader( "Help - key commands" );

	help.addHeader( "Shading" );

	dl = document.createElement( "dl" );

	_addKey( "1", "depth" );
	_addKey( "2", "leg angle" );
	_addKey( "3", "leg length" );
	_addKey( "4", "depth cursor " );
	_addKey( "5", "single colour" );
	_addKey( "6", "survey section" );
	_addKey( "7", "depth from surface" );
	_addKey( "8", "route" );

	_addKey( "[", "move depth cursor up" );
	_addKey( "]", "move depth cursor down" );

	if ( caveList.length > 0 ) _addKey( "n", "next cave" );

	help.appendChild( dl );

	help.addHeader( "View" );

	dl = document.createElement( "dl" );

	_addKey( "O", "orthogonal view" );
	_addKey( "P", "perspective view" );
	_addKey( "R", "reset to plan view" );
	_addKey( ".", "center view on last feature selected" );

	help.appendChild( dl );

	help.addHeader( "Visibility" );

	dl = document.createElement( "dl" );

	_addKey( "C", "scraps on/off [lox only]" );
	_addKey( "L", "labels on/off" );
	_addKey( "Q", "splay legs on/off" );
	_addKey( "S", "surface legs on/off" );
	_addKey( "T", "terrain on/off" );
	_addKey( "W", "LRUD walls on/off" );

	_addKey( "", "-" );

	_addKey( "<", "Decrease terrain opacity" );
	_addKey( ">", "Increase terrain opacity" );

	help.appendChild( dl );

	help.addHeader( "Selection" );

	dl = document.createElement( "dl" );

	_addKey( "V", "Remove all except selected section" );

	help.appendChild( dl );

	function _addKey( key, description ) {

		var dt = document.createElement( "dt" );
		var dd = document.createElement( "dd" );

		dt.textContent = key;
		dd.textContent = description;

		dl.appendChild( dt );
		dl.appendChild( dd );

	}

}

function initInfoPage() {

	var page = new Page( "icon_info" );

	page.addHeader( "Information" );

	var p = document.createElement( "p" );

	p.textContent = "Viewer - a work in progress 3d cave viewer for Survex (.3d) and Therion (.lox) models.";
	page.appendChild( p );

	p = document.createElement( "p" );

	p.textContent = "Requires a browser supporting WebGL (IE 11+ and most other recent browsers), no plugins required. Created using the THREE.js 3D library and chroma,js colour handling library.";
	page.appendChild( p );

}

function initSettingsPage () {

	// reset 
	terrainOverlay = null;
	terrainControls = [];

	var legShadingModesActive     = Object.assign( {}, legShadingModes );
	var terrainShadingModesActive = Object.assign( {}, terrainShadingModes );

	if ( viewState.hasTerrain ) legShadingModesActive.depth = SHADING_DEPTH;

	var page = new Page( "icon_settings" );

	page.addHeader( "Survey" );

	if ( caveList.length > 0 ) page.addSelect( "File", caveList, guiState, "file" );

	page.addHeader( "View" );

	page.addSelect( "Camera Type", cameraModes, viewState, "cameraType" );
	page.addSelect( "View",        cameraViews, viewState, "view" );

	page.addRange( "Vertical scaling", viewState, "zScale" );

	page.addHeader( "Shading" );

	page.addSelect( "Underground Legs", legShadingModesActive, viewState, "shadingMode" );

	if ( viewState.hasSurfaceLegs ) {

		page.addSelect( "Surface Legs", surfaceShadingModes, viewState, "surfaceShading" );

	}

	page.addHeader( "Visibility" );

	if ( viewState.hasEntrances )    page.addCheckbox( "Entrances",     viewState, "entrances" );

	page.addCheckbox( "Stations", viewState, "stations" );

	if ( viewState.hasEntrances )    page.addCheckbox( "Entrances",     viewState, "entrances" );
	if ( viewState.hasSplays )       page.addCheckbox( "Splay Legs",    viewState, "splays" );
	if ( viewState.hasSurfaceLegs )  page.addCheckbox( "Surface Legs",  viewState, "surfaceLegs" );
	if ( viewState.hasTerrain )      page.addCheckbox( "Terrain",       viewState, "terrain" );
	if ( viewState.hasWalls )        page.addCheckbox( "Walls (LRUD)",  viewState, "walls" );

	page.addCheckbox( "Indicators",   viewState, "HUD" );
	page.addCheckbox( "Bounding Box", viewState, "box" );

	if ( viewState.hasTerrain ) {

		var control;

		control = page.addHeader( "Terrain" );
		terrainControls.push( control );

		var overlays = viewState.terrainOverlays;

		if ( overlays.length > 0 ) terrainShadingModesActive[ "map overlay" ] = SHADING_OVERLAY;

		control = page.addSelect( "Shading", terrainShadingModesActive, viewState, "terrainShading" );
		terrainControls.push( control );

		if ( overlays.length > 1 ) {

			terrainOverlay = page.addSelect( "Overlay", overlays, viewState, "terrainOverlay" );
			terrainOverlay.style.display = "none";
			terrainControls.push( terrainOverlay );

		}

		control = page.addRange( "Terrain opacity", viewState, "terrainOpacity" );
		terrainControls.push( control );

		for ( var i = 0, l = terrainControls.length; i < l; i++ ) {

			terrainControls[ i ].style.display = "none";

		}

	}

}

function initUI () {

	Page.reset();

	// create UI side panel and reveal tabs

	initSettingsPage();
	initSelectionPage();
	initRoutePage();
	initInfoPage();
	initHelpPage();

	container.appendChild( Page.frame );

}

function handleDragover ( event ) {

	event.preventDefault();
	event.dataTransfer.dropEffect = "copy";

}

function handleDrop ( event ) {

	var dt = event.dataTransfer;

	event.preventDefault();

	for ( var i = 0; i < dt.files.length; i++ ) {

		var file = dt.files[ i ];

		if ( i === 0 ) {

			loadCaveLocalFile( file );

		} else {

			// FIXME load other drag and drop into local file list or ignore??
		}

	}

}

function resetUI () {

	if ( isCaveLoaded ) {

		isCaveLoaded = false;

		Page.clear();

		surveyTree  = null;

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

	progressBar.Start( "Loading file " + file + " ..." );

	caveLoader.loadURL( file );

}

function loadCaveLocalFile ( file ) {

	resetUI();
	Viewer.clearView();

	progressBar.Start( "Loading file " + file.name + " ..." );

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
		progressBar.Start( "Rendering..." );

		setTimeout( _delayedTasks2, 100 );

	}

	function _delayedTasks2 () {

		Viewer.loadCave( cave );
		progressBar.End();

		// viewComplete executed as "newCave"" event handler
	}

}

function viewComplete () {

	// display shading mode and initialize

	viewState.shadingMode = SHADING_HEIGHT;

	surveyTree = Viewer.getSurveyTree();
	isCaveLoaded = true;

	routes = new Routes( file, _routesLoaded );


	// drop reference to cave to free heap space
	cave = null;

	initUI();

	function _routesLoaded( routeNames ) {

		Viewer.addRoutes( routes );

		isRoutesLoaded = true;

	}

}

function keyDown ( event ) {

	if ( !isCaveLoaded ) return;

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

		viewState.shadingMode = SHADING_PATH;

		break;

	case 67: // toggle scraps visibility - 'c'

		if ( viewState.hasScraps ) viewState.scraps = !viewState.scraps;

		break;

	case 68: // dump a contructed route to a window - 'd'

		routes.loadRoute( "to sump", surveyTree );

		break;

	case 76: //toggle entrance labels - 'l'

		if ( viewState.hasEntrances ) viewState.entrances = !viewState.entrances;

		break;

	case 78: // load next cave in list - 'n'

		nextCave();

		break;

	case 79: //switch view to orthoganal - 'o'

		viewState.cameraType = CAMERA_ORTHOGRAPHIC;

		break;

	case 80: // switch view to perspective -'p'

		viewState.cameraType = CAMERA_PERSPECTIVE;

		break;

	case 81: // switch view to perspective -'q'

		if ( viewState.hasSplays ) viewState.splays = !viewState.splays;

		break;

	case 82: // reset camera positions and settings to initial plan view -'r'

		viewState.view = VIEW_PLAN;

		break;

	case 83: // switch view to perspective -'s'

		if ( viewState.hasSurfaceLegs ) viewState.surfaceLegs = !viewState.surfaceLegs;

		break;

	case 84: // switch terrain on/off 't'

		if ( viewState.hasTerrain ) viewState.terrain = !viewState.terrain;

		break;

	case 85: // switch terrain on/off 'u'

		if ( viewState.hasTerrain ) viewState.terrainShading = SHADING_PW;

		break;

	case 86: // cut selected survey section 'v'  

		resetUI();
		viewState.cut = true;

		break;

	case 87: // switch walls on/off 'w'

		if ( viewState.hasWalls ) viewState.walls = !viewState.walls;

		break;

	case 88: // look ast last POI - 'x'

		viewState.setPOI = true; // actual value here is ignored.

		break;

	case 90: // dev info - 'z'

		viewState.developerInfo = true; // actual value here is ignored.

		break;

	case 107: // increase cursor depth - '+' (keypad)
	case 219: // '[' key 

		viewState.cursorHeight++;

		break;

	case 109: // decrease cursor depth - '-' (keypad)
	case 221: // ']' key

		viewState.cursorHeight--;

		break;

	case 188: // decrease terrain opacity "<" key

		if ( viewState.hasTerrain ) viewState.terrainOpacity = Math.max( viewState.terrainOpacity - 0.05, 0 );

		break;

	case 190: // increase terrain opacity ">" key

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