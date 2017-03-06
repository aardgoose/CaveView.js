

import  {
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE,
	FACE_WALLS, FACE_SCRAPS, FEATURE_TRACES,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE,
	MATERIAL_LINE, MATERIAL_SURFACE,
	SHADING_HEIGHT, SHADING_SINGLE, SHADING_SHADED, SHADING_OVERLAY, SHADING_PATH,
	FEATURE_BOX, FEATURE_ENTRANCES, FEATURE_SELECTED_BOX, FEATURE_TERRAIN, FEATURE_STATIONS,
	VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_E, VIEW_ELEVATION_W, VIEW_PLAN, VIEW_NONE,
	upAxis,
	MOUSE_MODE_ROUTE_EDIT, MOUSE_MODE_NORMAL
} from '../core/constants';

import { HUD } from '../hud/HUD';
import { Materials } from '../materials/Materials';
import { CameraMove } from './CameraMove';
import { Survey } from './Survey';
import { Popup } from './Popup';
import { TiledTerrain } from '../terrain/TiledTerrain';
//import { DirectionGlobe } from '../analysis/DirectionGlobe';

import { OrbitControls } from '../core/OrbitControls';

import {
	EventDispatcher,
	Vector2, Vector3, Matrix4, Euler,
	Scene, Raycaster,
	DirectionalLight, HemisphereLight,
	LinearFilter, NearestFilter, RGBFormat,
	OrthographicCamera, PerspectiveCamera, 
	WebGLRenderer, WebGLRenderTarget
} from '../../../../three.js/src/Three';

//import { LeakWatch } from '../../../../LeakWatch/src/LeakWatch';

var lightPosition = new Vector3( -1, -1, 0.5 );
var CAMERA_OFFSET = 600;

var caveIsLoaded = false;

var container;

// THREE.js objects

var renderer;
var scene;
var oCamera;
var pCamera;
var camera;

var mouse = new Vector2();
var mouseMode = MOUSE_MODE_NORMAL;

var raycaster;
var terrain = null;
var directionalLight;
var survey;
var routes;
var limits;
var stats  = {};
var zScale;

var viewState = {};
var cursorHeight;

var shadingMode        = SHADING_HEIGHT;
var surfaceShadingMode = SHADING_SINGLE;
var terrainShadingMode = SHADING_SHADED;

var cameraMode;
var selectedSection = 0;

var controls;

var cameraMove;

var lastActivityTime = 0;
//var leakWatcher;

function init ( domID ) { // public method

	container = document.getElementById( domID );

	if ( !container ) alert( 'No container DOM object [' + domID + '] available' );

	var width  = container.clientWidth;
	var height = container.clientHeight;

	renderer = new WebGLRenderer( { antialias: true } ) ;

	renderer.setSize( width, height );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setClearColor( 0x000000 );
	renderer.autoClear = false;

	oCamera = new OrthographicCamera( -width / 2, width / 2, height / 2, -height / 2, 1, 2000 );

	oCamera.rotateOnAxis( upAxis, Math.PI / 2 );

	initCamera( oCamera );

	pCamera = new PerspectiveCamera( 75, width / height, 1, 2000 );

	initCamera( pCamera );

	camera = pCamera;

	raycaster = new Raycaster();

	renderer.clear();

	container.appendChild( renderer.domElement );

	controls = new OrbitControls( camera, renderer.domElement );

	cameraMove = new CameraMove( controls, renderView, onCameraMoveEnd );

	controls.addEventListener( 'change', function () { cameraMove.prepare( null, null ); cameraMove.start( 80 ); } );

	controls.enableDamping = true;

	// event handler
	window.addEventListener( 'resize', resize );

	Object.assign( viewState, EventDispatcher.prototype, {

		refresh: renderView

	} );

	Object.defineProperties( viewState, {

		'terrain': {
			writeable: true,
			get: function () { return testCameraLayer( FEATURE_TERRAIN ); },
			set: function ( x ) { loadTerrain( x ); setCameraLayer( FEATURE_TERRAIN, x ); this.dispatchEvent( { type: 'change', name: 'terrain' } ); }
		},

		'terrainShading': {
			writeable: true,
			get: function () { return terrainShadingMode; },
			set: function ( x ) { _viewStateSetter( setTerrainShadingMode, 'terrainShading', x ); }
		},

		'hasTerrain': {
			get: function () { return !!terrain; }
		},

		'terrainOverlays': {
			get: function () { return terrain && terrain.getOverlays(); }
		},

		'terrainOverlay': {
			writeable: true,
			get: function () { return terrain.getOverlay(); },
			set: function ( x ) { _viewStateSetter( setTerrainOverlay, 'terrainOverlay', x ); }
		},

		'terrainOpacity': {
			writeable: true,
			get: function () { return terrain.getOpacity(); },
			set: function ( x ) { setTerrainOpacity( x ); }
		},

		'shadingMode': {
			writeable: true,
			get: function () { return shadingMode; },
			set: function ( x ) { _viewStateSetter( setShadingMode, 'shadingMode', x ); }
		},

		'surfaceShading': {
			writeable: true,
			get: function () { return surfaceShadingMode; },
			set: function ( x ) { _viewStateSetter( setSurfaceShadingMode, 'surfaceShading', x ); }
		},

		'cameraType': {
			writeable: true,
			get: function () { return cameraMode; },
			set: function ( x ) { _viewStateSetter( setCameraMode, 'cameraType', x ); }
		},

		'view': {
			writeable: true,
			get: function () { return VIEW_NONE; },
			set: function ( x ) { _viewStateSetter( setViewMode, 'view', x ); }
		},

		'cursorHeight': {
			writeable: true,
			get: function () { return cursorHeight; },
			set: function ( x ) { setCursorHeight( x ); }
		},

		'maxHeight': {
			get: function () { return limits.max.z; },
		},

		'minHeight': {
			get: function () { return limits.min.z; },
		},

		'maxLegLength': {
			get: function () { return stats.maxLegLength; },
		},

		'minLegLength': {
			get: function () { return stats.minLegLength; },
		},

		'section': {
			writeable: true,
			get: function () { return selectedSection; },
			set: function ( x ) { _viewStateSetter( selectSection, 'section', x ); }
		},

		'routeEdit': {
			writeable: true,
			get: function () { return ( mouseMode === MOUSE_MODE_ROUTE_EDIT ); },
			set: function ( x ) { _setRouteEdit( x ); }
		},

		'setPOI': {
			writeable: true,
			get: function () { return true; },
			set: function ( x ) { _viewStateSetter( setCameraPOI, 'setPOI', x ); }
		},

/*
		'developerInfo': {
			writeable: true,
			get: function () { return true; },
			set: function ( x ) { showDeveloperInfo( x ); }
		},
*/

		'HUD': {
			writeable: true,
			get: function () { return HUD.getVisibility(); },
			set: function ( x ) { HUD.setVisibility( x ); }
		},

		'cut': {
			writeable: true,
			get: function () { return true; },
			set: function ( x ) { cutSection( x ); }
		},

		'zScale': {
			writeable: true,
			get: function () { return zScale; },
			set: function ( x ) { setZScale( x ); }
		},

		'autoRotate': {
			writeable: true,
			get: function () { return controls.autoRotate; },
			set: function ( x ) { setAutoRotate( !! x ); }
		},

		'autoRotateSpeed': {
			writeable: true,
			get: function () { return controls.autoRotateSpeed / 11; },
			set: function ( x ) { controls.autoRotateSpeed = x * 11; }
		}

	} );

	_enableLayer( FEATURE_BOX,       'box' );
	_enableLayer( FEATURE_ENTRANCES, 'entrances' );
	_enableLayer( FEATURE_STATIONS,  'stations' );
	_enableLayer( FEATURE_TRACES,    'traces' );
	_enableLayer( FACE_SCRAPS,       'scraps' );
	_enableLayer( FACE_WALLS,        'walls' );
	_enableLayer( LEG_SPLAY,         'splays' );
	_enableLayer( LEG_SURFACE,       'surfaceLegs' );
	
	_hasLayer( FEATURE_ENTRANCES, 'hasEntrances' );
	_hasLayer( FEATURE_TRACES,    'hasTraces' );
	_hasLayer( FACE_SCRAPS,       'hasScraps' );
	_hasLayer( FACE_WALLS,        'hasWalls' );
	_hasLayer( LEG_SPLAY,         'hasSplays' );
	_hasLayer( LEG_SURFACE,       'hasSurfaceLegs' );

	Materials.initCache( viewState );

	HUD.init( domID, renderer );

	return;

	function _enableLayer ( layerTag, name ) {

		Object.defineProperty( viewState, name, {
			writeable: true,
			get: function () { return testCameraLayer( layerTag ); },
			set: function ( x ) { setCameraLayer( layerTag, x ); this.dispatchEvent( { type: 'change', name: name } ); }
		} );

	}

	function _hasLayer ( layerTag, name ) {

		Object.defineProperty( viewState, name, {
			get: function () { return survey.hasFeature( layerTag ); }
		} );

	}

	function _viewStateSetter ( modeFunction, name, newMode ) {

		modeFunction( Number( newMode ) );
		viewState.dispatchEvent( { type: 'change', name: name } );

	}

	function _setRouteEdit ( x ) {

		mouseMode = x ? MOUSE_MODE_ROUTE_EDIT : MOUSE_MODE_NORMAL;

	}

}

function addRoutes ( newRoutes ) {

	routes = newRoutes;

	if ( survey ) survey.addRoutes( newRoutes );

	routes.addEventListener( 'changed', _routesChanged );

	function _routesChanged ( /* event */ ) {

		setShadingMode( shadingMode );

	}

}

function setZScale ( scale ) {

	// scale - in range 0 - 1

	var lastScale = Math.pow( 2, ( zScale - 0.5 ) * 4 );
	var newScale  = Math.pow( 2, ( scale - 0.5 )  * 4 );

	survey.applyMatrix( new Matrix4().makeScale( 1, 1, newScale / lastScale ) );

	zScale = scale;

	renderView();

}

function setAutoRotate ( state ) {

	controls.autoRotate = state;

	if ( state ) {

		cameraMove.prepare( null, null );
		cameraMove.start( 2952000 );

	} else {

		cameraMove.stop();

	}

}

function setCursorHeight ( x ) {

	cursorHeight = x;
	viewState.dispatchEvent( { type: 'cursorChange', name: 'cursorHeight' } );

	renderView();

}

function setTerrainOpacity ( x ) {

	terrain.setOpacity( x );
	viewState.dispatchEvent( { type: 'change', name: 'terrainOpacity' } );

	renderView();

}
/*
function showDeveloperInfo( x ) {

	var info = renderer.getResourceInfo();

	if ( leakWatcher === undefined ) {

		leakWatcher = new LeakWatch();
		leakWatcher.setBaseline( scene, info );

	} else {

		leakWatcher.compare( scene, info );

	}

}
*/
function renderDepthTexture () {

	if ( terrain === null || !terrain.isLoaded() ) return;

	var dim = 512;

	// set camera frustrum to cover region/survey area

	var width  = container.clientWidth;
	var height = container.clientHeight;

	var range = limits.getSize();

	var scaleX = width / range.x;
	var scaleY = height / range.y;

	if ( scaleX < scaleY ) {

		height = height * scaleX / scaleY;

	} else {

		width = width * scaleY / scaleX;

	}

	// render the terrain to a new canvas square canvas and extract image data

	var rtCamera = new OrthographicCamera( -width / 2, width / 2,  height / 2, -height / 2, -10000, 10000 );

	rtCamera.layers.set( FEATURE_TERRAIN ); // just render the terrain

	scene.overrideMaterial = Materials.getDepthMapMaterial();

	var renderTarget = new WebGLRenderTarget( dim, dim, { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBFormat } );

	renderTarget.texture.generateMipmaps = false;
	renderTarget.texture.name = 'CV.DepthMapTexture';

	Materials.createDepthMaterial( MATERIAL_LINE, limits, renderTarget.texture );
	Materials.createDepthMaterial( MATERIAL_SURFACE, limits, renderTarget.texture );

	renderer.setSize( dim, dim );
	renderer.setPixelRatio( 1 );

	renderer.clear();
	renderer.render( scene, rtCamera, renderTarget, true );

	renderer.setRenderTarget();	// revert to screen canvas

	renderer.setSize( container.clientWidth, container.clientHeight );
	renderer.setPixelRatio( window.devicePixelRatio );

	scene.overrideMaterial = null;

	renderView();

}

function setCameraMode ( mode ) {

	if ( mode === cameraMode ) return;

	// get offset vector of current camera from target

	var offset = camera.position.clone().sub( controls.target );

	switch ( mode ) {

	case CAMERA_PERSPECTIVE:

		offset.setLength( CAMERA_OFFSET / oCamera.zoom );

		camera = pCamera;

		break;

	case CAMERA_ORTHOGRAPHIC:

		// calculate zoom from ratio of pCamera distance from target to base distance.
		oCamera.zoom = CAMERA_OFFSET / offset.length();
		offset.setLength( CAMERA_OFFSET );

		camera = oCamera;

		break;

	default:

		console.log( 'unknown camera mode', mode );
		return;

	}

	// update new camera with position to give same apparent zoomm and view

	camera.position.copy( offset.add( controls.target ) );

	camera.updateProjectionMatrix();
	camera.lookAt( controls.target );

	controls.object = camera;

	cameraMode = mode;

	renderView();

}

function initCamera ( camera ) {

	camera.up = upAxis;
	camera.zoom = 1;

	camera.layers.set( 0 );

	camera.layers.enable( LEG_CAVE );
	camera.layers.enable( FEATURE_ENTRANCES );
	camera.layers.enable( FEATURE_BOX );
	camera.layers.enable( FEATURE_SELECTED_BOX );

	camera.position.set( 0, 0, CAMERA_OFFSET );
	camera.lookAt( 0, 0, 0 );
	camera.updateProjectionMatrix();

}

function setCameraLayer ( layerTag, enable ) {

	if ( enable ) {

		oCamera.layers.enable( layerTag );
		pCamera.layers.enable( layerTag );

	} else {

		oCamera.layers.disable( layerTag );
		pCamera.layers.disable( layerTag );

	}

	renderView();

}

function testCameraLayer ( layerTag ) {

	return ( ( oCamera.layers.mask & 1 << layerTag ) > 0 );

}

function setViewMode ( mode, t ) {

	var position = new Vector3();
	var tAnimate = t || 240;

	switch ( mode ) {

	case VIEW_PLAN:

		// reset camera to start position
		position.set( 0, 0, CAMERA_OFFSET );

		break;

	case VIEW_ELEVATION_N:

		position.set( 0, CAMERA_OFFSET, 0 );

		break;

	case VIEW_ELEVATION_S:

		position.set( 0, -CAMERA_OFFSET, 0 );

		break;

	case VIEW_ELEVATION_E:

		position.set( CAMERA_OFFSET, 0, 0 );

		break;

	case VIEW_ELEVATION_W:

		position.set( -CAMERA_OFFSET, 0, 0 );

		break;

	default:

		console.log( 'invalid view mode specified: ', mode );
		return;

	}

	cameraMove.prepare( position, new Vector3() );

	cameraMove.start( tAnimate );

}

function setTerrainShadingMode ( mode ) {

	if ( terrain.setShadingMode( mode, renderView ) ) terrainShadingMode = mode;

	renderView();

}

function setShadingMode ( mode ) {

	if ( survey.setShadingMode( mode ) ) shadingMode = mode;

	renderView();

}

function setSurfaceShadingMode ( mode ) {

	if ( survey.setLegShading( LEG_SURFACE, mode ) ) surfaceShadingMode = mode;

	renderView();

}

function setTerrainOverlay ( overlay ) {

	if ( terrainShadingMode === SHADING_OVERLAY ) terrain.setOverlay( overlay, renderView );

}

function cutSection () {

	if ( selectedSection === 0 ) return;

	survey.remove( terrain );
	survey.cutSection( selectedSection );

	// grab a reference to prevent survey being destroyed in clearView()
	var cutSurvey = survey;

	// reset view
	clearView();

	loadSurvey( cutSurvey );

}

function selectSection ( id ) {

	survey.clearSectionSelection();
	var node = survey.selectSection( id );

	var entranceBox = survey.setEntrancesSelected();

	setShadingMode( shadingMode );

	selectedSection = id;

	if ( id === 0 ) return;

	if ( node.p === undefined ) {

		var box = survey.getSelectedBox();
		var boundingBox;

		if ( box ) {

			box.geometry.computeBoundingBox();

			boundingBox = box.geometry.boundingBox;

		} else {

			boundingBox = entranceBox;

		}

		boundingBox.applyMatrix4( survey.matrixWorld );

		cameraMove.prepare( null, boundingBox );

	} else {

		cameraMove.prepare( null, new Vector3().copy( node.p ).applyMatrix4( survey.matrixWorld ) );

		selectedSection = 0;

	}

	renderView();

}

function resize () {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	// adjust the renderer to the new canvas size
	renderer.setSize( width, height );

	if ( oCamera === undefined ) return;

	// adjust cameras to new aspect ratio etc.
	oCamera.left   = -width / 2;
	oCamera.right  =  width / 2;
	oCamera.top    =  height / 2;
	oCamera.bottom = -height / 2;

	oCamera.updateProjectionMatrix();

	pCamera.aspect = width / height;

	pCamera.updateProjectionMatrix();

	renderView();

}

function clearView () {

	// clear the current cave model, and clear the screen
	caveIsLoaded = false;

	renderer.clear();

	HUD.setVisibility( false );

	if ( survey ) {

		survey.remove( terrain );
		scene.remove( survey );

	}

	controls.enabled = false;

	survey          = null;
	terrain         = null;
	selectedSection = 0;
	scene           = new Scene();

	shadingMode = SHADING_HEIGHT;

	// remove event listeners

	unloadTerrainListeners();
	container.removeEventListener( 'mousedown', mouseDown );

	scene.add( pCamera );
	scene.add( oCamera );

	initCamera( pCamera );
	initCamera( oCamera );

	viewState.cameraType = CAMERA_PERSPECTIVE;
	setViewMode( VIEW_PLAN, 1 );

	renderView();

}

function loadCave ( cave ) {

	if ( ! cave ) {

		alert( 'failed loading cave information' );
		return;

	}

	loadSurvey( new Survey( cave ) );

}

function loadSurvey ( newSurvey ) {

	survey = newSurvey;

	stats = survey.getStats();

	setScale( survey );

	terrain = survey.getTerrain();

	scene.up = upAxis;

	scene.add( survey );
//	scene.add( new DirectionGlobe( survey ) );

	// light the model for Lambert Shaded surface

	directionalLight = new DirectionalLight( 0xffffff );
	directionalLight.position.copy( lightPosition );

	scene.add( directionalLight );

	scene.add( new HemisphereLight( 0xffffff, 0x00ffff, 0.3 ) );
//	scene.add( new AmbientLight( 0x303030 ) );

	caveIsLoaded = true;

	selectSection( 0 );

	setSurfaceShadingMode( surfaceShadingMode );
	// set if we have independant terrain maps

	if ( terrain === null ) {

		terrain = new TiledTerrain( survey.limits, _tilesLoaded );

		if ( !terrain.hasCoverage() ) {

			terrain = null;

		} else {

			terrain.tileArea( survey.limits );
			survey.add( terrain );

		}

	} else {

		survey.add( terrain );
		setTerrainShadingMode( terrainShadingMode );
		setTimeout( renderDepthTexture, 0 ); // delay to after newCave event - after material cache is flushed

	}

	scene.matrixAutoUpdate = false;

	container.addEventListener( 'mousedown', mouseDown, false );

	HUD.setVisibility( true );

	// signal any listeners that we have a new cave
	viewState.dispatchEvent( { type: 'newCave', name: 'newCave' } );

	controls.object = camera;
	controls.enabled = true;

	renderView();

	function _tilesLoaded () {

		setTerrainShadingMode( terrainShadingMode );
		loadTerrainListeners();

		if ( !Materials.getDepthMaterial( MATERIAL_LINE ) ) renderDepthTexture();

	}

}

function loadTerrain ( mode ) {

	if ( terrain.isLoaded() ) {

		if ( mode ) {

			loadTerrainListeners();

		} else {

			unloadTerrainListeners();

		}

	}

}

function loadTerrainListeners () {

	clockStart();

	controls.addEventListener( 'end', clockStart );

}

function unloadTerrainListeners () {

	if ( ! controls ) return;

	controls.removeEventListener( 'end', clockStart );

	clockStop();

}

function clockStart ( /* event */ ) {

	lastActivityTime = performance.now();

}

function clockStop ( /* event */ ) {

	lastActivityTime = 0;

}

function mouseDown ( event ) {

	var picked;

	mouse.x =   ( event.clientX / container.clientWidth  ) * 2 - 1;
	mouse.y = - ( event.clientY / container.clientHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	survey.mouseTargets.push( survey.stations );

	var intersects = raycaster.intersectObjects( survey.mouseTargets, false );
	var result;

	for ( var i = 0, l = intersects.length; i < l; i++ ) {

		picked = intersects[ i ];

		switch ( mouseMode ) {

		case MOUSE_MODE_NORMAL:

			if ( picked.object.isPoints ) {

				result = _selectStation( picked );

			} else {

				result = _selectEntrance( picked );

			}

			break;

		case MOUSE_MODE_ROUTE_EDIT:

			result = _selectSegment( picked );

			break;

		}

		if ( result ) break;

	}

	function _selectStation ( picked ) {

		var station = survey.stations.getStationByIndex( picked.index );

		var point = station.p;
		var p = new Vector3().copy( point ).applyMatrix4( survey.matrixWorld );

		var popup = new Popup();

		var name = station.getPath();

		// reduce name length if too long

		var long = false;
		var tmp;

		while ( name.length > 20 ) {

			tmp = name.split( '.' );
			tmp.shift();

			name = tmp.join( '.' );
			long = true;

		}

		if ( long ) name = '...' + name;

		popup.addLine( name );
		popup.addLine( 'x: ' + point.x + ' m' ).addLine( 'y: ' + point.y + ' m' ).addLine( 'z: ' + point.z + ' m' );

		popup.display( container, event.clientX, event.clientY, camera, p );

		cameraMove.prepare( null, p.clone() );

		return true;

	}

	function _selectSegment ( picked ) {

		routes.toggleSegment( picked.index );

		setShadingMode( SHADING_PATH );

		renderView();

		return true;

	}

	function _selectEntrance ( picked ) {

		if ( ! viewState.entrances ) return false;

		var entrance = picked.object;
		var position = entrance.getWorldPosition();

		cameraMove.prepare( position.clone().add( new Vector3( 0, 0, 5 ) ), position );

		console.log( entrance.type, entrance.name );

		if ( survey.isRegion === true ) {

			survey.loadFromEntrance( entrance, _loaded );

		} else {

			cameraMove.start( 80 );

		}

		return true;

	}

	function _loaded () {

		setShadingMode( shadingMode );

		renderView();

	}

}

var renderView = function () {

	var lPosition = new Vector3();
	var rotation = new Euler();

	return function renderView () {

		if ( ! caveIsLoaded ) return;

		camera.getWorldRotation( rotation );

		lPosition.copy( lightPosition );

		directionalLight.position.copy( lPosition.applyAxisAngle( upAxis, rotation.z ) );

		renderer.clear();
		renderer.render( scene, camera );

		HUD.renderHUD();

		// update LOD Scene Objects

		var lods = survey.lodTargets;
		var l    = lods.length;

		if ( l > 0 ) {

			for ( var i = 0; i < l; i++ ) {

				lods[ i ].update( camera );

			}

		}

		clockStart();

	};

} ();


function onCameraMoveEnd () {

	if ( terrain && terrain.isTiled() && viewState.terrain ) setTimeout( updateTerrain, 500 );

}

function updateTerrain () {

	if ( lastActivityTime && performance.now() - lastActivityTime > 500 ) {

		clockStop();
		terrain.zoomCheck( camera );

	}

}

function setCameraPOI ( /* fixme */ ) {

	cameraMove.start( 200 );

}

function setScale ( obj ) {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	limits = survey.limits;
	zScale = 0.5;

	var range  = limits.getSize();
	var center = limits.getCenter();

	// initialize cursor height to be mid range of heights
	cursorHeight = center.z;

	// scale and translate model coordiniates into THREE.js world view
	var scale = Math.min( width / range.x, height / range.y );

	obj.scale.set( scale, scale, scale );
	obj.position.set( -center.x * scale, -center.y * scale, -center.z * scale );

	HUD.setScale( scale );

	// pass to survey to adjust size of symbology

	obj.setScale( scale );

}

function getStats () {

	return stats;

}

function getControls () {

	return controls;

}

function getSurveyTree () {

	return survey.getSurveyTree();

}

// export public interface

export var Viewer = {
	init:          init,
	clearView:     clearView,
	loadCave:      loadCave,
	addRoutes:     addRoutes,
	getStats:      getStats,
	getSurveyTree: getSurveyTree,
	getControls:   getControls,
	getState:      viewState
};


// EOF