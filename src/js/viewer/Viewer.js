

import  {
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE,
	FACE_WALLS, FACE_SCRAPS,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE,
	MATERIAL_LINE, MATERIAL_SURFACE,
	SHADING_HEIGHT, SHADING_SINGLE, SHADING_SHADED, SHADING_OVERLAY,
	FEATURE_BOX, FEATURE_ENTRANCES, FEATURE_SELECTED_BOX, FEATURE_TERRAIN, 
	VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_E, VIEW_ELEVATION_W, VIEW_PLAN, VIEW_NONE,
	upAxis 
} from '../core/constants.js';

import { HUD } from '../hud/HUD.js';
import { Materials } from '../materials/Materials.js';
import { Survey } from './Survey.js';
import { TiledTerrain } from '../terrain/TiledTerrain.js';

import { OrbitControls } from '../core/OrbitControls.js';

import {
	EventDispatcher,
	Vector2, Vector3, Matrix4, Quaternion, Euler,  Box3,
	Scene, Group, Raycaster,
	AmbientLight, DirectionalLight,
	LinearFilter, NearestFilter, RGBFormat,
	OrthographicCamera, PerspectiveCamera, 
	WebGLRenderer, WebGLRenderTarget,
	Math as _Math
} from '../../../../three.js/src/Three.js'; 

import { LeakWatch } from '../../../../LeakWatch/src/LeakWatch.js';

var lightPosition = new Vector3( -1, -1, 0.5 );
var CAMERA_OFFSET = 600;

var caveIsLoaded = false;

var container;

// THREE.js objects

var renderer;
var scene;
var model;
var oCamera;
var pCamera;
var camera;

var mouse = new Vector2();

var raycaster;
var terrain = null;
var directionalLight;
var survey;
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

// Point of interest tracking

var activePOIPosition;

var targetPOI = null;

var controls;

var lastActivityTime = 0;
var frameCount = 0;
var leakWatcher;

function init ( domID ) { // public method

	container = document.getElementById( domID );

	if ( !container ) alert( "No container DOM object [" + domID + "] available" );

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

	controls.addEventListener( "change", function () { startAnimation( 60 ); } );
	controls.enableDamping = true;

	// event handler
	window.addEventListener( "resize", resize );

	Object.assign( viewState, EventDispatcher.prototype, {

		refresh: renderView

	} );

	Object.defineProperty( viewState, "terrain", {
		writeable: true,
		get: function () { return testCameraLayer( FEATURE_TERRAIN ); },
		set: function ( x ) { loadTerrain( x ); setCameraLayer( FEATURE_TERRAIN, x ); this.dispatchEvent( { type: "change", name: "terrain" } ); }
	} );

	Object.defineProperty( viewState, "terrainShading", {
		writeable: true,
		get: function () { return terrainShadingMode; },
		set: function ( x ) { _viewStateSetter( setTerrainShadingMode, "terrainShading", x ); }
	} );

	Object.defineProperty( viewState, "hasTerrain", {
		get: function () { return !!terrain; }
	} );

	Object.defineProperty( viewState, "terrainOverlays", {
		get: function () { return terrain && terrain.getOverlays(); }
	} );

	Object.defineProperty( viewState, "terrainOverlay", {
		writeable: true,
		get: function () { return terrain.getOverlay(); },
		set: function ( x ) { _viewStateSetter( setTerrainOverlay, "terrainOverlay", x ); }
	} );

	Object.defineProperty( viewState, "terrainOpacity", {
		writeable: true,
		get: function () { return terrain.getOpacity(); },
		set: function ( x ) { setTerrainOpacity( x ); }
	} );

	Object.defineProperty( viewState, "shadingMode", {
		writeable: true,
		get: function () { return shadingMode; },
		set: function ( x ) { _viewStateSetter( setShadingMode, "shadingMode", x ); }
	} );

	Object.defineProperty( viewState, "surfaceShading", {
		writeable: true,
		get: function () { return surfaceShadingMode; },
		set: function ( x ) { _viewStateSetter( setSurfaceShadingMode, "surfaceShading", x ); }
	} );

	Object.defineProperty( viewState, "cameraType", {
		writeable: true,
		get: function () { return cameraMode; },
		set: function ( x ) { _viewStateSetter( setCameraMode, "cameraType", x ); }
	} );

	Object.defineProperty( viewState, "view", {
		writeable: true,
		get: function () { return VIEW_NONE; },
		set: function ( x ) { _viewStateSetter( setViewMode, "view", x ); }
	} );

	Object.defineProperty( viewState, "cursorHeight", {
		writeable: true,
		get: function () { return cursorHeight; },
		set: function ( x ) { setCursorHeight( x ); }
	} );

	Object.defineProperty( viewState, "maxHeight", {
		get: function () { return limits.max.z; },
	} );

	Object.defineProperty( viewState, "minHeight", {
		get: function () { return limits.min.z; },
	} );

	Object.defineProperty( viewState, "maxLegLength", {
		get: function () { return stats.maxLegLength; },
	} );

	Object.defineProperty( viewState, "minLegLength", {
		get: function () { return stats.minLegLength; },
	} );

	Object.defineProperty( viewState, "section", {
		writeable: true,
		get: function () { return selectedSection; },
		set: function ( x ) { _viewStateSetter( selectSection, "section", x ); }
	} );

	Object.defineProperty( viewState, "setPOI", {
		writeable: true,
		get: function () { return targetPOI.name; },
		set: function ( x ) { _viewStateSetter( setCameraPOI, "setPOI", x ); }
	} );

	Object.defineProperty( viewState, "developerInfo", {
		writeable: true,
		get: function () { return true; },
		set: function ( x ) { showDeveloperInfo( x ); }
	} );

	if ( HUD === undefined ) {

		Object.defineProperty( viewState, "hasHUD", {
			value: false,
		} );

	} else {

		Object.defineProperty( viewState, "hasHUD", {
			value: true,
		} );

		Object.defineProperty( viewState, "HUD", {
			writeable: true,
			get: function () { return HUD.getVisibility(); },
			set: function ( x ) { HUD.setVisibility( x ); }
		} );
	}

	_enableLayer( FEATURE_BOX,       "box" );
	_enableLayer( FEATURE_ENTRANCES, "entrances" );
	_enableLayer( FACE_SCRAPS,       "scraps" );
	_enableLayer( FACE_WALLS,        "walls" );
	_enableLayer( LEG_SPLAY,         "splays" );
	_enableLayer( LEG_SURFACE,       "surfaceLegs" );
	
	_hasLayer( FEATURE_ENTRANCES, "hasEntrances" );
	_hasLayer( FACE_SCRAPS,       "hasScraps" );
	_hasLayer( FACE_WALLS,        "hasWalls" );
	_hasLayer( LEG_SPLAY,         "hasSplays" );
	_hasLayer( LEG_SURFACE,       "hasSurfaceLegs" );

	Object.defineProperty( viewState, "cut", {
		writeable: true,
		get: function () { return true; },
		set: function ( x ) { cutSection( x ) }
	} );

	Object.defineProperty( viewState, "zScale", {
		writeable: true,
		get: function () { return zScale; },
		set: function ( x ) { setZScale( x ) }
	} );

	Materials.initCache( viewState );

	HUD.init( domID, renderer );

	return;

	function _enableLayer ( layerTag, name ) {

		Object.defineProperty( viewState, name, {
			writeable: true,
			get: function () { return testCameraLayer( layerTag ); },
			set: function ( x ) { setCameraLayer( layerTag, x ); this.dispatchEvent( { type: "change", name: name } ); }
		} );

	}

	function _hasLayer ( layerTag, name ) {

		Object.defineProperty( viewState, name, {
			get: function () { return survey.hasFeature( layerTag ); }
		} );

	}

	function _viewStateSetter ( modeFunction, name, newMode ) {

		modeFunction( Number( newMode ) );
		viewState.dispatchEvent( { type: "change", name: name } );

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

function setCursorHeight( x ) {

	cursorHeight = x;
	viewState.dispatchEvent( { type: "cursorChange", name: "cursorHeight" } );

	renderView();

}

function setTerrainOpacity( x ) {

	terrain.setOpacity( x );
	viewState.dispatchEvent( { type: "change", name: "terrainOpacity" } )

	renderView();

}

function showDeveloperInfo( x ) {

	var info = renderer.getResourceInfo();

	if ( leakWatcher === undefined ) {

		leakWatcher = new LeakWatch();
		leakWatcher.setBaseline( scene, info );

	} else {

		leakWatcher.compare( scene, info );

	}

}

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

	rtCamera.layers.enable( FEATURE_TERRAIN ); // just render the terrain

	scene.overrideMaterial = Materials.getDepthMapMaterial();

	var renderTarget = new WebGLRenderTarget( dim, dim, { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBFormat } );

	renderTarget.texture.generateMipmaps = false;
	renderTarget.texture.name = "CV.DepthMapTexture";

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

		console.log( "unknown camera mode", mode );
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

	var position = new  Vector3();
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

		console.log( "invalid view mode specified: ", mode );
		return;

	}

	activePOIPosition = new Vector3();

	targetPOI = {
		tAnimate: tAnimate,
		position: activePOIPosition,
		cameraPosition: position,
		cameraZoom: 1
	};

	controls.enabled = false;
	startAnimation( tAnimate + 1 );

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
	survey.selectSection( id );

	var entranceBox = survey.setEntrancesSelected();

	setShadingMode( shadingMode );

	selectedSection = id;

	if ( id === 0 ) return;

	var box = survey.getSelectedBox();
	var boundingBox;
	var obj;

	if ( box ) {

		box.geometry.computeBoundingBox();

		boundingBox = box.geometry.boundingBox;
		obj = box;

	} else {

		boundingBox = entranceBox;
		obj = null;

	}

	boundingBox.applyMatrix4( survey.matrixWorld );

	targetPOI = {
		tAnimate: 0,
		object:      obj,
		position:    boundingBox.center(),
		boundingBox: boundingBox
	};

	renderView();

}

function resize () {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	//  adjust the renderer to the new canvas size
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

		scene.dispose();

	}

	controls.enabled = false;

	survey          = null;
	terrain         = null;
	selectedSection = 0;
	scene           = new Scene();
	targetPOI       = null;

	shadingMode = SHADING_HEIGHT;

	// remove event listeners

	unloadTerrainListeners();
	container.removeEventListener( "click", entranceClick );

	scene.add( pCamera );
	scene.add( oCamera );

	initCamera( pCamera );
	initCamera( oCamera );

	viewState.cameraType = CAMERA_PERSPECTIVE;
	setViewMode( VIEW_PLAN, 1 );

	renderView();

}

function loadCave ( cave ) {

	if (!cave) {

		alert( "failed loading cave information" );
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

	// light the model for Lambert Shaded surface

	directionalLight = new DirectionalLight( 0xffffff );
	directionalLight.position.copy( lightPosition );

	scene.add( directionalLight );

	scene.add( new AmbientLight( 0x303030 ) );

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

	container.addEventListener( "click", entranceClick, false );

	HUD.setVisibility( true );

	// signal any listeners that we have a new cave
	viewState.dispatchEvent( { type: "newCave", name: "newCave" } );

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

	controls.addEventListener( "end", clockStart );

}

function unloadTerrainListeners () {

	if ( !controls ) return;

	controls.removeEventListener( "end", clockStart );

	clockStop();

}

function clockStart ( event ) {

	lastActivityTime = performance.now();

}

function clockStop ( event ) {

	lastActivityTime = 0;

}

function entranceClick ( event ) {

	mouse.x =   ( event.clientX / container.clientWidth  ) * 2 - 1;
	mouse.y = - ( event.clientY / container.clientHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( survey.mouseTargets, false );

	if ( intersects.length > 0 ) {

		var entrance = intersects[ 0 ].object;
		var position = entrance.getWorldPosition();

/*		targetPOI = {
			tAnimate:    80,
			object:      entrance,
			position:    position,
			cameraPosition: position.clone().add( new Vector3( 0, 0, 5 ) ),
			cameraZoom: 1,
			boundingBox: new Box3().expandByPoint( entrance.position ),
			quaternion:  new Quaternion()
		};
*/
		activePOIPosition = controls.target;

		console.log( entrance.type, entrance.name );

		if ( survey.isRegion === true ) {

			survey.loadFromEntrance( entrance, _loaded );

		} else {

			controls.enabled = false;
			startAnimation( targetPOI.tAnimate + 1 );

		}

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

		if ( !caveIsLoaded ) return;

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

		if ( targetPOI !== null && targetPOI.tAnimate > 0 ) {

			// handle move to new Point of Interest (POI)
			_moveToPOI();

		} else {

			if ( terrain && terrain.isTiled() && viewState.terrain ) {

				if ( lastActivityTime && performance.now() - lastActivityTime > 500 ) {

					clockStop();
					terrain.zoomCheck( camera );

				}

			}

			controls.update();

		}

		return;

		function _moveToPOI () {

			targetPOI.tAnimate--;

			var t = 1 - targetPOI.tAnimate / ( targetPOI.tAnimate + 1 );

			activePOIPosition.lerp( targetPOI.position, t );

			camera.position.lerp( targetPOI.cameraPosition, t );
			camera.lookAt( activePOIPosition );

			camera.zoom = camera.zoom + ( targetPOI.cameraZoom - camera.zoom ) * t;

			if ( targetPOI.quaternion ) camera.quaternion.slerp( targetPOI.quaternion, t );

			camera.updateProjectionMatrix();
			HUD.update();

			if ( targetPOI.tAnimate === 0 ) {

				controls.target = targetPOI.position;
				controls.enabled = true;

				// restart the clock to trigger refresh of terrain
				clockStart();
				targetPOI = null;

			}

		}

	}

} ();

function setCameraPOI ( x ) {

	var boundingBox;
	var elevation;

	if ( targetPOI === null ) return;

	targetPOI.tAnimate = 80;

	var size = targetPOI.boundingBox.getSize();

	if ( camera instanceof PerspectiveCamera ) {

		var tan = Math.tan( _Math.DEG2RAD * 0.5 * camera.getEffectiveFOV() );

		var e1 = 1.5 * tan * size.y / 2 + size.z;
		var e2 = tan * camera.aspect * size.x / 2 + size.z;

		elevation = Math.max( e1, e2 );

		targetPOI.cameraZoom = 1;

		if ( elevation === 0 ) elevation = 100;

	} else {

		var hRatio = ( camera.right - camera.left ) / size.x;
		var vRatio = ( camera.top - camera.bottom ) / size.y;

		targetPOI.cameraZoom = Math.min( hRatio, vRatio );
		elevation = 600;

	}

	activePOIPosition = controls.target;

	targetPOI.cameraPosition   = targetPOI.position.clone();
	targetPOI.cameraPosition.z = targetPOI.cameraPosition.z + elevation;
	targetPOI.quaternion = new Quaternion();

	// disable orbit controls until move to selected POI is conplete

	controls.enabled = false;
	startAnimation( targetPOI.tAnimate + 1 );

}

function startAnimation( frames ) {

	if ( frameCount === 0 ) {

		frameCount = frames;
		animate();

	} else {

		frameCount = Math.max( frameCount, frames );

	}

}

function animate () {

	if ( frameCount > 0 ) {

		requestAnimationFrame( animate );

		frameCount--;
		renderView();

	}

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
	getStats:      getStats,
	getSurveyTree: getSurveyTree,
	getControls:   getControls,
	getState:      viewState
};


// EOF