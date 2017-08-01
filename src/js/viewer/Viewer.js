

import  {
	VERSION,
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE, CAMERA_OFFSET,
	FACE_WALLS, FACE_SCRAPS, FEATURE_TRACES,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE, LABEL_STATION,
	SHADING_HEIGHT, SHADING_SINGLE, SHADING_SHADED, SHADING_OVERLAY, SHADING_PATH,
	SHADING_DEPTH, SHADING_DEPTH_CURSOR,
	FEATURE_BOX, FEATURE_ENTRANCES, FEATURE_SELECTED_BOX, FEATURE_TERRAIN, FEATURE_STATIONS,
	VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_E, VIEW_ELEVATION_W, VIEW_PLAN, VIEW_NONE,
	upAxis,
	MOUSE_MODE_ROUTE_EDIT, MOUSE_MODE_NORMAL
} from '../core/constants';

import { HUD } from '../hud/HUD';
import { Materials } from '../materials/Materials';
import { CameraMove } from './CameraMove';
import { Survey } from './Survey';
import { StationPopup } from './StationPopup';
import { WebTerrain } from '../terrain/WebTerrain';
import { Overlay } from '../terrain/Overlay';
import { setEnvironment } from '../core/lib';

//import { DirectionGlobe } from '../analysis/DirectionGlobe';

import { OrbitControls } from '../core/OrbitControls';

import {
	EventDispatcher,
	Vector2, Vector3, Matrix4, Euler,
	Scene, Raycaster,
	DirectionalLight, HemisphereLight,
	LinearFilter, NearestFilter, RGBAFormat,
	OrthographicCamera, PerspectiveCamera,
	WebGLRenderer, WebGLRenderTarget,
} from '../../../../three.js/src/Three';

//import { LeakWatch } from '../../../../LeakWatch/src/LeakWatch';

var lightPosition = new Vector3( -1, -1, 0.5 );
var RETILE_TIMEOUT = 150; // ms pause after last movement before attempting retiling

var caveIsLoaded = false;

var container;

// THREE.js objects

var renderer;
var scene = new Scene();
var oCamera;
var pCamera;

var camera;

var mouse = new Vector2();
var mouseMode = MOUSE_MODE_NORMAL;
var mouseTargets = [];

var raycaster;
var terrain = null;
var directionalLight;
var survey;
var limits;
var stats = {};
var zScale;

var cursorHeight;

var shadingMode;
var surfaceShadingMode = SHADING_SINGLE;
var terrainShadingMode;

var overlays = {};
var activeOverlay = null;

var cameraMode;
var selectedSection = 0;

var controls;
var defaultTarget = new Vector3();

var cameraMove;

var lastActivityTime = 0;
//var leakWatcher;

var Viewer = Object.create( EventDispatcher.prototype );

function init ( domID, configuration ) { // public method

	console.log( 'CaveView v' + VERSION );

	container = document.getElementById( domID );

	if ( ! container ) alert( 'No container DOM object [' + domID + '] available' );

	setEnvironment( configuration );

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

	scene.add( pCamera );
	scene.add( oCamera );

	directionalLight = new DirectionalLight( 0xffffff );
	directionalLight.position.copy( lightPosition );

	scene.add( directionalLight );

	scene.add( new HemisphereLight( 0xffffff, 0x00ffff, 0.3 ) );

	raycaster = new Raycaster();

	renderer.clear();

	container.appendChild( renderer.domElement );

	controls = new OrbitControls( camera, renderer.domElement );

	cameraMove = new CameraMove( controls, renderView, onCameraMoveEnd );

	controls.addEventListener( 'change', function () { cameraMove.prepare( null, null ); cameraMove.start( 80 ); } );

	controls.enableDamping = true;

	// event handler
	window.addEventListener( 'resize', resize );

	Object.defineProperties( Viewer, {

		'container': {
			value: container
		},

		'terrain': {
			writeable: true,
			get: function () { return testCameraLayer( FEATURE_TERRAIN ); },
			set: function ( x ) { loadTerrain( x ); }
		},

		'terrainShading': {
			writeable: true,
			get: function () { return terrainShadingMode; },
			set: function ( x ) { _stateSetter( setTerrainShadingMode, 'terrainShading', x ); }
		},

		'hasTerrain': {
			get: function () { return !! terrain; }
		},

		'terrainDatumShift': {
			writeable: true,
			get: function () { return !! terrain.activeDatumShift; },
			set: function ( x ) { applyTerrainDatumShift( x ); }
		},

		'terrainOverlays': {
			get: function () { if ( terrain.isTiled ) return Object.keys( overlays ); else return terrain.hasOverlay ? [ true ] : []; }
		},

		'terrainOverlay': {
			writeable: true,
			get: function () { return activeOverlay; },
			set: function ( x ) { _stateSetter( setTerrainOverlay, 'terrainOverlay', x ); }
		},

		'terrainOpacity': {
			writeable: true,
			get: function () { return terrain.getOpacity(); },
			set: function ( x ) { setTerrainOpacity( x ); }
		},

		'shadingMode': {
			writeable: true,
			get: function () { return shadingMode; },
			set: function ( x ) { _stateSetter( setShadingMode, 'shadingMode', x ); }
		},

		'surfaceShading': {
			writeable: true,
			get: function () { return surfaceShadingMode; },
			set: function ( x ) { _stateSetter( setSurfaceShadingMode, 'surfaceShading', x ); }
		},

		'cameraType': {
			writeable: true,
			get: function () { return cameraMode; },
			set: function ( x ) { _stateSetter( setCameraMode, 'cameraType', x ); }
		},

		'view': {
			writeable: true,
			get: function () { return VIEW_NONE; },
			set: function ( x ) { _stateSetter( setViewMode, 'view', x ); }
		},

		'cursorHeight': {
			writeable: true,
			get: function () { return cursorHeight; },
			set: function ( x ) { setCursorHeight( x ); }
		},

		'initCursorHeight': {
			writeable: true,
			get: function () { return cursorHeight; },
			set: function ( x ) { cursorHeight = x; }
		},

		'maxHeight': {
			get: function () { return limits.max.z; }
		},

		'minHeight': {
			get: function () { return limits.min.z; }
		},

		'maxLegLength': {
			get: function () { return stats.maxLegLength; }
		},

		'minLegLength': {
			get: function () { return stats.minLegLength; }
		},

		'section': {
			writeable: true,
			get: function () { return selectedSection; },
			set: function ( x ) { _stateSetter( selectSection, 'section', x ); }
		},

		'highlight': {
			writeable: true,
			set: function ( x ) { _stateSetter( highlightSelection, 'highlight', x ); }
		},

		'routeEdit': {
			writeable: true,
			get: function () { return ( mouseMode === MOUSE_MODE_ROUTE_EDIT ); },
			set: function ( x ) { _setRouteEdit( x ); this.dispatchEvent( { type: 'change', name: 'routeEdit' } ); }
		},

		'setPOI': {
			writeable: true,
			get: function () { return true; },
			set: function ( x ) { _stateSetter( setCameraPOI, 'setPOI', x ); }
		},

		'developerInfo': {
			writeable: true,
			get: function () { return true; },
			set: function ( x ) { showDeveloperInfo( x ); }
		},

		'HUD': {
			writeable: true,
			get: function () { return HUD.getVisibility(); },
			set: function ( x ) { HUD.setVisibility( x ); }
		},

		'cut': {
			writeable: true,
			get: function () { return true; },
			set: function () { cutSection(); }
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

	_enableLayer( FEATURE_BOX, 'box' );

	_conditionalLayer( FEATURE_ENTRANCES, 'entrances' );
	_conditionalLayer( FEATURE_STATIONS,  'stations' );
	_conditionalLayer( FEATURE_TRACES,    'traces' );
	_conditionalLayer( FACE_SCRAPS,       'scraps' );
	_conditionalLayer( FACE_WALLS,        'walls' );
	_conditionalLayer( LEG_SPLAY,         'splays' );
	_conditionalLayer( LEG_SURFACE,       'surfaceLegs' );
	_conditionalLayer( LABEL_STATION,     'stationLabels' );

	Materials.initCache( Viewer );

	HUD.init( domID, renderer );

	return;

	function _enableLayer ( layerTag, name ) {

		Object.defineProperty( Viewer, name, {
			writeable: true,
			get: function () { return testCameraLayer( layerTag ); },
			set: function ( x ) { setCameraLayer( layerTag, x ); this.dispatchEvent( { type: 'change', name: name } ); }
		} );

	}

	function _conditionalLayer ( layerTag, name ) {

		_enableLayer ( layerTag, name );

		name = 'has' + name.substr( 0, 1 ).toUpperCase() + name.substr( 1 );

		Object.defineProperty( Viewer, name, {
			get: function () { return survey.hasFeature( layerTag ); }
		} );

	}

	function _stateSetter ( modeFunction, name, newMode ) {

		modeFunction( isNaN( newMode ) ? newMode : Number( newMode ) );

		Viewer.dispatchEvent( { type: 'change', name: name } );

	}

	function _setRouteEdit ( x ) {

		mouseMode = x ? MOUSE_MODE_ROUTE_EDIT : MOUSE_MODE_NORMAL;

		switch ( mouseMode ) {

		case MOUSE_MODE_NORMAL:

			mouseTargets = survey.pointTargets;

			break;

		case MOUSE_MODE_ROUTE_EDIT:

			mouseTargets = survey.legTargets;

			break;

		default:

			console.warn( 'invalid mouse mode' );

		}

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
	Viewer.dispatchEvent( { type: 'cursorChange', name: 'cursorHeight' } );

	renderView();

}

function setTerrainOpacity ( x ) {

	terrain.setOpacity( x );
	Viewer.dispatchEvent( { type: 'change', name: 'terrainOpacity' } );

	renderView();

}

function applyTerrainDatumShift( x ) {

	terrain.applyDatumShift( x );
	Viewer.dispatchEvent( { type: 'change', name: 'terrainDatumShift' } );

	renderView();

}

function showDeveloperInfo( /* x */ ) {

	console.log( renderer.info );
/*
	var info = renderer.getResourceInfo();

	if ( leakWatcher === undefined ) {

		leakWatcher = new LeakWatch();
		leakWatcher.setBaseline( scene, info );

	} else {

		leakWatcher.compare( scene, info );

	}
*/

}

function renderDepthTexture () {

	if ( terrain === null || ! terrain.isLoaded() ) return;

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

	var	rtCamera = new OrthographicCamera( -width / 2, width / 2,  height / 2, -height / 2, -10000, 10000 );

	rtCamera.layers.set( FEATURE_TERRAIN ); // just render the terrain

	scene.overrideMaterial = Materials.getDepthMapMaterial( terrain );

	var renderTarget = new WebGLRenderTarget( dim, dim, { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat } );

	renderTarget.texture.generateMipmaps = false;
	renderTarget.texture.name = 'CV.DepthMapTexture';

	Materials.setTerrain( terrain );

	renderer.setSize( dim, dim );
	renderer.setPixelRatio( 1 );

	renderer.clear();
	renderer.render( scene, rtCamera, renderTarget, true );

	// correct height between entrances and terrain ( compensates for mismatch beween CRS and datums )

	terrain.addHeightMap( renderer, renderTarget );

	survey.calibrateTerrain( terrain );

	// restore renderer to normal render size and target

	renderer.setRenderTarget();	// revert to screen canvas

	renderer.setSize( container.clientWidth, container.clientHeight );
	renderer.setPixelRatio( window.devicePixelRatio );

	scene.overrideMaterial = null;

	renderView();

	// clear renderList to release objects on heap associated with rtCamera
	renderer.renderLists.dispose();

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

		console.warn( 'unknown camera mode', mode );
		return;

	}

	// update new camera with position to give same apparent zoom and view

	camera.position.copy( offset.add( controls.target ) );

	camera.updateProjectionMatrix();
	camera.lookAt( controls.target );

	controls.object = camera;

	cameraMode = mode;

	HUD.update();

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

	return ( ( camera.layers.mask & 1 << layerTag ) > 0 );

}

function setViewMode ( mode, t ) {

	var cameraPosition = new Vector3();
	var tAnimate = t || 240;

	switch ( mode ) {

	case VIEW_PLAN:

		// reset camera to start position
		cameraPosition.set( 0, 0, CAMERA_OFFSET );

		break;

	case VIEW_ELEVATION_N:

		cameraPosition.set( 0, CAMERA_OFFSET, 0 );

		break;

	case VIEW_ELEVATION_S:

		cameraPosition.set( 0, -CAMERA_OFFSET, 0 );

		break;

	case VIEW_ELEVATION_E:

		cameraPosition.set( CAMERA_OFFSET, 0, 0 );

		break;

	case VIEW_ELEVATION_W:

		cameraPosition.set( -CAMERA_OFFSET, 0, 0 );

		break;

	default:

		console.warn( 'invalid view mode specified: ', mode );
		return;

	}

	cameraPosition.add( defaultTarget );

	cameraMove.cancel();
	cameraMove.prepare( cameraPosition, defaultTarget );
	cameraMove.start( tAnimate );

}

function setTerrainShadingMode ( mode ) {

	if ( terrain.setShadingMode( mode, renderView ) ) terrainShadingMode = mode;

	renderView();

}

function setShadingMode ( mode ) {

	if ( terrain === null && ( mode === SHADING_DEPTH || mode === SHADING_DEPTH_CURSOR ) ) return;
	if ( survey.setShadingMode( mode ) ) shadingMode = mode;

	renderView();

}

function setSurfaceShadingMode ( mode ) {

	if ( survey.setLegShading( LEG_SURFACE, mode ) ) surfaceShadingMode = mode;

	renderView();

}

function setTerrainOverlay ( overlayName ) {

	if ( terrainShadingMode === SHADING_OVERLAY ) {

		activeOverlay = overlayName;

		terrain.setOverlay( overlays[ overlayName ], renderView );

	}

}

function addOverlay ( name, overlayProvider ) {

	overlays[ name ] = new Overlay( overlayProvider, container );

	if ( Object.keys( overlays ).length === 1 ) {

		activeOverlay = name;

	}

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

function highlightSelection ( id ) {

	survey.highlightSelection( id );

	renderView();

}

function selectSection ( id ) {

	var node = survey.selectSection( id );

	setShadingMode( shadingMode );

	selectedSection = id;

	if ( id === 0 ) return;

	if ( node.p === undefined ) {

		if ( node.boundingBox === undefined ) return;
		// a section of the survey rather than a station

		var boundingBox = node.boundingBox.clone();

		cameraMove.prepare( null, boundingBox.applyMatrix4( survey.matrixWorld ) );

	} else {

		// a single station

		cameraMove.prepare( null, survey.getWorldPosition( node.p ) );

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
	mouseMode       = MOUSE_MODE_NORMAL;
	mouseTargets    = [];

	shadingMode = SHADING_HEIGHT;
	surfaceShadingMode = SHADING_SINGLE;
	terrainShadingMode = SHADING_SHADED;

	// remove event listeners

	unloadTerrainListeners();

	Materials.flushCache();

	container.removeEventListener( 'mousedown', mouseDown );

	initCamera( pCamera );
	initCamera( oCamera );

	Viewer.cameraType = CAMERA_PERSPECTIVE;
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

	var asyncTerrainLoading = false;

	survey = newSurvey;

	stats = survey.getFeature( LEG_CAVE ).stats;

	setScale( survey );

	terrain = survey.terrain;

	scene.up = upAxis;

	scene.add( survey );
//	scene.add( new DirectionGlobe( survey ) );

	caveIsLoaded = true;

	selectSection( 0 );

	mouseTargets = survey.pointTargets;

	setSurfaceShadingMode( surfaceShadingMode );
	// set if we have independant terrain maps

	if ( terrain === null ) {

		terrain = new WebTerrain( survey, _terrainReady, _tilesLoaded, renderView );
		asyncTerrainLoading = true;

	} else {

		survey.add( terrain );
		setTerrainShadingMode( terrainShadingMode );

		renderDepthTexture();

	}

	scene.matrixAutoUpdate = false;

	container.addEventListener( 'mousedown', mouseDown, false );

	HUD.setVisibility( true );

	// signal any listeners that we have a new cave
	if ( ! asyncTerrainLoading ) Viewer.dispatchEvent( { type: 'newCave', name: 'newCave' } );

	controls.object = camera;
	controls.enabled = true;

	survey.getRoutes().addEventListener( 'changed', _routesChanged );

	setViewMode( VIEW_PLAN, 1 );

	renderView();

	function _terrainReady () {

		if ( terrain.hasCoverage() ) {

			setTerrainShadingMode( terrainShadingMode );

			terrain.tileArea( survey.limits );
			terrain.setDefaultOverlay( overlays[ activeOverlay ] );

			survey.add( terrain );

		} else {

			terrain = null;

		}

		// delayed notification to ensure and event listeners get accurate terrain information
		Viewer.dispatchEvent( { type: 'newCave', name: 'newCave' } );

	}

	function _tilesLoaded () {

		renderView();
		loadTerrainListeners();

		if ( terrain.depthTexture === null ) renderDepthTexture();

	}

	function _routesChanged ( /* event */ ) {

		setShadingMode( shadingMode );
		renderView();

	}

}

function loadTerrain ( mode ) {

	if ( terrain.isLoaded() ) {

		if ( mode ) {

			loadTerrainListeners();

		} else {

			unloadTerrainListeners();

		}

		terrain.setVisibility( mode );

		setCameraLayer( FEATURE_TERRAIN, mode );

		Viewer.dispatchEvent( { type: 'change', name: 'terrain' } );

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

	var picked, result;

	mouse.x =   ( event.clientX / container.clientWidth  ) * 2 - 1;
	mouse.y = - ( event.clientY / container.clientHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( mouseTargets, false );

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

		var station = survey.selectStation( picked.index );

		renderView();

		var depth = ( terrain ) ? station.p.z - terrain.getHeight( station.p ) : null;

		var popup = new StationPopup( station, survey.getGeographicalPosition( station.p ), depth );

		var p = survey.getWorldPosition( station.p );

		popup.display( container, event.clientX, event.clientY, camera, p );

		cameraMove.prepare( null, p.clone() );

		return true;

	}

	function _selectSegment ( picked ) {

		var routes = getRoutes();

		routes.toggleSegment( picked.index );

		setShadingMode( SHADING_PATH );

		renderView();

		return true;

	}

	function _selectEntrance ( picked ) {

		if ( ! Viewer.entrances ) return false;

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

		survey.update( camera, controls.target );

		renderer.clear();
		renderer.render( scene, camera );

		HUD.renderHUD();

		clockStart();

	};

} ();


function onCameraMoveEnd () {

	if ( terrain && terrain.isTiled && Viewer.terrain ) setTimeout( updateTerrain, RETILE_TIMEOUT );

}

function updateTerrain () {

	if ( lastActivityTime && performance.now() - lastActivityTime > RETILE_TIMEOUT ) {

		clockStop();

		if ( terrain.zoomCheck( camera ) ) {

			setTimeout( updateTerrain, RETILE_TIMEOUT * 5 );

		}

	}

}

function setCameraPOI ( /* fixme */ ) {

	cameraMove.start( 200 );

}

function setScale ( obj ) {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	// scaling to compensate distortion introduced by projection ( x and y coords only ) - approx only
	var scaleFactor = survey.scaleFactor;

	limits = survey.limits;
	zScale = 0.5;

	var range = limits.getSize();

	// initialize cursor height to be mid range of heights
	cursorHeight = 0;

	var hScale = Math.min( width / range.x, height / range.y );
	var vScale = hScale * scaleFactor;

	var scale = new Vector3( hScale, hScale, vScale );

	obj.scale.copy( scale );

	obj.position.copy( survey.modelLimits.getCenter().multiply( scale ).negate() );

	HUD.setScale( vScale );

	// pass to survey to adjust size of symbology

	obj.setScale( vScale );

}

function getStats () {

	return stats;

}

function getControls () {

	return controls;

}

function getMetadata () {

	return survey.getMetadataURL();

}

function getRoutes () {

	return survey.getRoutes();

}

function getSurveyTree () {

	return survey.surveyTree;

}

// export public interface

Object.assign( Viewer, {
	init:          init,
	clearView:     clearView,
	loadCave:      loadCave,
	getMetadata:   getMetadata,
	getRoutes:     getRoutes,
	getStats:      getStats,
	getSurveyTree: getSurveyTree,
	getControls:   getControls,
	getState:      Viewer,
	renderView:    renderView,
	addOverlay:    addOverlay
} );

export { Viewer };


// EOF