 "use strict";

var CV = CV || {};

CV.lightPosition = new THREE.Vector3( -1, -1, 0.5 );
CV.CAMERA_OFFSET = 600;

CV.Viewer = ( function () {

var caveIsLoaded = false;

var container;

// THREE.js objects

var renderer;
var scene;
var model;
var oCamera;
var pCamera;
var camera;

var mouse = new THREE.Vector2();

var raycaster;
var terrain = null;
var directionalLight;
var region;
var survey;
var limits;
var stats  = {};
var scaleMatrix;
var zScale;

var viewState = {};
var cursorHeight;

var shadingMode        = CV.SHADING_HEIGHT;
var surfaceShadingMode = CV.SHADING_SINGLE;
var terrainShadingMode = CV.SHADING_SHADED;

var cameraMode;
var selectedSection = 0;

// Point of interest tracking

var activePOIPosition;

var targetPOI = null;

var controls;

var lastActivityTime = 0;

function __dyeTrace() {

	var start = new THREE.Vector3();
	var end   = new THREE.Vector3( 100, 100, 100 );
	var progress;
	var max = 100;

	var geometry = new THREE.Geometry();

	for ( var i = 0; i < max; i++ ) {

		progress = i / max;

		geometry.vertices.push ( new THREE.Vector3().lerpVectors( start, end, progress ) );
		geometry.colors.push( new THREE.Color( Math.sin( Math.PI * progress ), 255, 0 ) );

	}

	scene.add ( new THREE.Points( geometry, new CV.TestMaterial( 25 ) ) );

}

function init ( domID ) { // public method

	container = document.getElementById( domID );

	if ( !container ) alert( "No container DOM object [" + domID + "] available" );

	var width  = container.clientWidth;
	var height = container.clientHeight;

	renderer = new THREE.WebGLRenderer( { antialias: true } ) ;

	renderer.setSize( width, height );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setClearColor( 0x000000 );
	renderer.autoClear = false;

	oCamera = new THREE.OrthographicCamera( -width / 2, width / 2, height / 2, -height / 2, 1, 10000 );

	oCamera.rotateOnAxis( CV.upAxis, Math.PI / 2 );

	initCamera( oCamera );

	pCamera = new THREE.PerspectiveCamera( 75, width / height, 1, 10000 );

	initCamera( pCamera );

	camera = pCamera;

	raycaster = new THREE.Raycaster();

	renderer.clear();

	container.appendChild( renderer.domElement );

	controls = new THREE.OrbitControls( camera, renderer.domElement );

	controls.enableDamping = true;

	// event handler
	window.addEventListener( "resize", resize );

	Object.assign( viewState, THREE.EventDispatcher.prototype );

	Object.defineProperty( viewState, "terrain", {
		writeable: true,
		get: function () { return testCameraLayer( CV.FEATURE_TERRAIN ); },
		set: function ( x ) { loadTerrain( x ); setCameraLayer( CV.FEATURE_TERRAIN, x ); this.dispatchEvent( { type: "change", name: "terrain" } ); }
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
		set: function ( x ) { terrain.setOpacity( x ); viewState.dispatchEvent( { type: "change", name: "terrainOpacity" } ) }
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
		get: function () { return CV.VIEW_NONE; },
		set: function ( x ) { _viewStateSetter( setViewMode, "view", x ); }
	} );

	Object.defineProperty( viewState, "cursorHeight", {
		writeable: true,
		get: function () { return cursorHeight; },
		set: function ( x ) { cursorHeight = x; this.dispatchEvent( { type: "cursorChange", name: "cursorHeight" } ); }
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

	if ( CV.Hud === undefined ) {

		Object.defineProperty( viewState, "hasHUD", {
			value: false,
		} );

	} else {

		Object.defineProperty( viewState, "hasHUD", {
			value: true,
		} );

		Object.defineProperty( viewState, "HUD", {
			writeable: true,
			get: function () { return CV.Hud.getVisibility(); },
			set: function ( x ) { CV.Hud.setVisibility( x ); }
		} );
	}

	_enableLayer( CV.FEATURE_BOX,       "box" );
	_enableLayer( CV.FEATURE_ENTRANCES, "entrances" );
	_enableLayer( CV.FACE_SCRAPS,       "scraps" );
	_enableLayer( CV.FACE_WALLS,        "walls" );
	_enableLayer( CV.LEG_SPLAY,         "splays" );
	_enableLayer( CV.LEG_SURFACE,       "surfaceLegs" );
	
	_hasLayer( CV.FEATURE_ENTRANCES, "hasEntrances" );
	_hasLayer( CV.FACE_SCRAPS,       "hasScraps" );
	_hasLayer( CV.FACE_WALLS,        "hasWalls" );
	_hasLayer( CV.LEG_SPLAY,         "hasSplays" );
	_hasLayer( CV.LEG_SURFACE,       "hasSurfaceLegs" );

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

	CV.Materials.initCache( viewState );

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

	region.applyMatrix( new THREE.Matrix4().makeScale( 1, 1, newScale / lastScale ) );

	zScale = scale;

}

function renderDepthTexture () {

	if ( terrain === null || !terrain.isLoaded() ) return;

	var dim = 512;

	// set camera frustrum to cover region/survey area

	var width  = container.clientWidth;
	var height = container.clientHeight;

	var range = limits.size();

	var scaleX = width / range.x;
	var scaleY = height / range.y;

	if ( scaleX < scaleY ) {

		height = height * scaleX / scaleY;

	} else {

		width = width * scaleY / scaleX;

	}

	// render the terrain to a new canvas square canvas and extract image data

	var rtCamera = new THREE.OrthographicCamera( -width / 2, width / 2,  height / 2, -height / 2, -10000, 10000 );

	rtCamera.layers.enable( CV.FEATURE_TERRAIN ); // just render the terrain

	scene.overrideMaterial = CV.Materials.getDepthMapMaterial();

	var renderTarget = new THREE.WebGLRenderTarget( dim, dim, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat } );

	renderTarget.texture.generateMipmaps = false;

	CV.Materials.createDepthMaterial( CV.MATERIAL_LINE, limits, renderTarget.texture );
	CV.Materials.createDepthMaterial( CV.MATERIAL_SURFACE, limits, renderTarget.texture );

	renderer.setSize( dim, dim );
	renderer.setPixelRatio( 1 );

	renderer.clear();
	renderer.render( scene, rtCamera, renderTarget, true );

	renderer.setRenderTarget();	// revert to screen canvas

	renderer.setSize( container.clientWidth, container.clientHeight );
	renderer.setPixelRatio( window.devicePixelRatio );

	scene.overrideMaterial = null;

}

function setCameraMode ( mode ) {

	if ( mode === cameraMode ) return;

	// get offset vector of current camera from target

	var offset = camera.position.clone().sub( controls.target );

	switch ( mode ) {

	case CV.CAMERA_PERSPECTIVE:

		offset.setLength( CV.CAMERA_OFFSET / oCamera.zoom );

		camera = pCamera;

		break;

	case CV.CAMERA_ORTHOGRAPHIC:

		// calculate zoom from ratio of pCamera distance from target to base distance.
		oCamera.zoom = CV.CAMERA_OFFSET / offset.length();
		offset.setLength( CV.CAMERA_OFFSET );

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

}

function initCamera ( camera ) {

	camera.up = CV.upAxis;
	camera.zoom = 1;

	camera.layers.set( 0 );

	camera.layers.enable( CV.LEG_CAVE );
	camera.layers.enable( CV.FEATURE_ENTRANCES );
	camera.layers.enable( CV.FEATURE_BOX );

	camera.position.set( 0, 0, CV.CAMERA_OFFSET );
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

}

function testCameraLayer ( layerTag ) {

	return ( ( oCamera.layers.mask & 1 << layerTag ) > 0 );

}

function setViewMode ( mode, t ) {

	var position = new  THREE.Vector3();
	var tAnimate = t || 240;

	switch ( mode ) {

	case CV.VIEW_PLAN:

		// reset camera to start position
		position.set( 0, 0, CV.CAMERA_OFFSET );

		break;

	case CV.VIEW_ELEVATION_N:

		position.set( 0, CV.CAMERA_OFFSET, 0 );

		break;

	case CV.VIEW_ELEVATION_S:

		position.set( 0, -CV.CAMERA_OFFSET, 0 );

		break;

	case CV.VIEW_ELEVATION_E:

		position.set( CV.CAMERA_OFFSET, 0, 0 );

		break;

	case CV.VIEW_ELEVATION_W:

		position.set( -CV.CAMERA_OFFSET, 0, 0 );

		break;

	default:

		console.log( "invalid view mode specified: ", mode );
		return;

	}

	activePOIPosition = new THREE.Vector3();

	targetPOI = {
		tAnimate: tAnimate,
		position: activePOIPosition,
		cameraPosition: position,
		cameraZoom: 1
	};

	controls.enabled = false;

}

function setTerrainShadingMode ( mode ) {

	if ( terrain.setShadingMode( mode ) ) terrainShadingMode = mode;

}

function setShadingMode ( mode ) {

	if ( survey.setShadingMode( mode ) ) shadingMode = mode;

}

function setSurfaceShadingMode ( mode ) {

	if ( survey.setLegShading( CV.LEG_SURFACE, mode ) ) surfaceShadingMode = mode;

}

function setTerrainOverlay ( overlay ) {

	if ( terrainShadingMode === CV.SHADING_OVERLAY ) terrain.setOverlay( overlay );

}

function cutSection () {

	if ( selectedSection === 0 ) return;

	survey.cutSection( selectedSection );

	// grab a reference to prevent survey being destroyed in clearView()
	var cutSurvey = survey;

	// reset view
	clearView()

	loadSurvey( cutSurvey );

}

function selectSection ( id ) {

	survey.clearSectionSelection();
	survey.selectSection( id );

	var entranceBox = survey.setEntrancesSelected();

	setShadingMode( shadingMode );

	var box = survey.getSelectedBox();

	if ( id === 0 ) return;

	if ( box ) {

		box.geometry.computeBoundingBox();

		targetPOI = {
			tAnimate: 0,
			object:      box,
			position:    box.geometry.boundingBox.center().applyMatrix4( scaleMatrix ),
			boundingBox: box.geometry.boundingBox
		};

		console.log( targetPOI.position );

	} else {

		targetPOI = {
			tAnimate: 0,
			object:      null,
			position:    entranceBox.center().applyMatrix4( scaleMatrix ),
			boundingBox: entranceBox
		};

	}

	selectedSection = id;

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

}

function clearView () {

	// clear the current cave model, and clear the screen
	caveIsLoaded = false;

	renderer.clear();
	CV.Hud.setVisibility( false );

	if ( terrain ) terrain.dying = true;

	controls.enabled = false;

	survey          = null;
	terrain         = null;
	selectedSection = 0;
	scene           = new THREE.Scene();
	region          = new THREE.Group();
	targetPOI       = null;

	shadingMode = CV.SHADING_HEIGHT;

	// remove event listeners

	unloadTerrainListeners();
	container.removeEventListener( "click", entranceClick);

	scene.add( pCamera );
	scene.add( oCamera );

	initCamera( pCamera );
	initCamera( oCamera );

	viewState.cameraType = CV.CAMERA_PERSPECTIVE;
	setViewMode( CV.VIEW_PLAN, 1 );

	renderView();

}

function loadCave ( cave ) {

	if (!cave) {

		alert( "failed loading cave information" );
		return;

	}

	loadSurvey( new CV.Survey( cave ) );

}

function loadSurvey ( newSurvey ) {

	survey = newSurvey;

	stats = survey.getStats();

	setScale();

	terrain = survey.getTerrain();

	scene.up = CV.upAxis;
	scene.add( scaleObject( region ) );

	region.add( survey );

	var box = new THREE.BoxHelper( survey.limits, 0xffffff );

	box.layers.set( CV.FEATURE_BOX );

	survey.add( box );

	// light the model for Lambert Shaded surface

	directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.copy( CV.lightPosition );

	scene.add( directionalLight );

	scene.add( new THREE.AmbientLight( 0x303030 ) );

	caveIsLoaded = true;

	selectSection( 0 );

	setSurfaceShadingMode( surfaceShadingMode );
	// set if we have independant terrain maps

	if ( terrain === null ) {

		terrain = new CV.TiledTerrain( survey.limits, _tilesLoaded );

		if ( !terrain.hasCoverage() ) {

			terrain = null;

		} else {

			terrain.tileArea( survey.limits );
			region.add( terrain );

		}

	} else {

		region.add( terrain );
		setTerrainShadingMode( terrainShadingMode );
		setTimeout( renderDepthTexture, 0 ); // delay to after newCave event - after material cache is flushed

	}

	scene.matrixAutoUpdate = false;

	container.addEventListener( "click", entranceClick, false );

	CV.Hud.setVisibility( true );

	// signal any listeners that we have a new cave
	viewState.dispatchEvent( { type: "newCave", name: "newCave" } );

	controls.object = camera;
	controls.enabled = true;

	//__dyeTrace(); // FIXME test function

	animate();

	function _tilesLoaded () {

		setTerrainShadingMode( terrainShadingMode );
		loadTerrainListeners();

		if ( !CV.Materials.getDepthMaterial( CV.MATERIAL_LINE ) ) renderDepthTexture();

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

		targetPOI = {
			tAnimate:    80,
			object:      entrance,
			position:    position,
			cameraPosition: position.clone().add( new THREE.Vector3( 0, 0, 5 ) ),
			cameraZoom: 1,
			boundingBox: new THREE.Box3().expandByPoint( entrance.position ),
			quaternion:  new THREE.Quaternion()
		};

		activePOIPosition = controls.target;
	
		console.log(entrance.type, entrance.name );

	}

}

var renderView = function () {

	var lPosition = new THREE.Vector3();
	var rotation = new THREE.Euler();

	return function renderView () {

		if ( !caveIsLoaded ) return;

		camera.getWorldRotation( rotation );

		lPosition.copy( CV.lightPosition );

		directionalLight.position.copy( lPosition.applyAxisAngle( CV.upAxis, rotation.z ) );

		renderer.clear();
		renderer.render( scene, camera );

		CV.Hud.renderHUD( renderer, camera );

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

			var t =  1 - targetPOI.tAnimate / ( targetPOI.tAnimate + 1 );

			activePOIPosition.lerp( targetPOI.position, t );

			camera.position.lerp( targetPOI.cameraPosition, t );
			camera.lookAt( activePOIPosition );

			camera.zoom = camera.zoom + ( targetPOI.cameraZoom - camera.zoom ) * t;

			if ( targetPOI.quaternion ) camera.quaternion.slerp( targetPOI.quaternion, t );

			camera.updateProjectionMatrix();
			CV.Hud.update();

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

//	var size = targetPOI.boundingBox.size().multiplyScalar( scaleMatrix.elements[ 0 ] ) ;
	var size = targetPOI.boundingBox.size().multiplyScalar( scaleMatrix.elements[ 0 ] ) ;

	if ( camera instanceof THREE.PerspectiveCamera ) {

		var tan = Math.tan( THREE.Math.DEG2RAD * 0.5 * camera.getEffectiveFOV() );

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
	targetPOI.quaternion = new THREE.Quaternion();

	// disable orbit controls until move to selected POI is conplete

	controls.enabled = false;

}

function animate () {

	requestAnimationFrame( animate );
	renderView();

}

function setScale () {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	limits = survey.limits;
	zScale = 0.5;

	var range  = limits.size();
	var center = limits.center();

	// initialize cursor height to be mid range of heights
	cursorHeight = center.z;

	// scale and translate model coordiniates into THREE.js world view
	var scale = Math.min( width / range.x, height / range.y );

	scaleMatrix = new THREE.Matrix4().makeScale( scale, scale, scale );

	scaleMatrix.multiply( new THREE.Matrix4().makeTranslation( -center.x, -center.y, -center.z ) );

	CV.Hud.setScale( scale );

}

function scaleObject ( obj ) {

	obj.applyMatrix( scaleMatrix );

	return obj;

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

return {
	init:          init,
	clearView:     clearView,
	loadCave:      loadCave,
	getStats:      getStats,
	getSurveyTree: getSurveyTree,
	getControls:   getControls,
	getState:      viewState
};

} () );// end of Viewer Module


// EOF