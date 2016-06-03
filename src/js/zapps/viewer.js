 "use strict";

var CV = CV || {};

CV.MATERIAL_LINE       = 1;
CV.MATERIAL_SURFACE    = 2;

CV.CAMERA_ORTHOGRAPHIC = 1;
CV.CAMERA_PERSPECTIVE  = 2;

CV.VIEW_PLAN           = 1;
CV.VIEW_ELEVATION_N    = 2;
CV.VIEW_ELEVATION_S    = 3;
CV.VIEW_ELEVATION_E    = 4;
CV.VIEW_ELEVATION_W    = 5;

CV.lightPosition = new THREE.Vector3( -1, -1, 0.5 );  

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
var viewMode;
var selectedSection = 0;

// Point of interest tracking

var activePOIPosition;

var targetPOI = null;

var controls;

var lastActivityTime = 0;

function __dyeTrace() {

	return;

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

	if (!container) alert( "No container DOM object [" + domID + "] available" );

	var width  = container.clientWidth;
	var height = container.clientHeight;

	renderer = new THREE.WebGLRenderer( { antialias: true } ) ;

	renderer.setSize( width, height );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setClearColor( 0x000000 );
	renderer.autoClear = false;

	oCamera = new THREE.OrthographicCamera( -width / 2, width / 2, height / 2, -height / 2, 1, 10000 );

	oCamera.rotateOnAxis( CV.upAxis, Math.PI / 2 );
	oCamera.up = CV.upAxis;

	initCameraLayers( oCamera );

	pCamera = new THREE.PerspectiveCamera( 75, width / height, 1, 10000 );

	pCamera.up = CV.upAxis;

	initCameraLayers( pCamera );

	camera = pCamera;

	raycaster = new THREE.Raycaster();

	renderer.clear();

	container.appendChild( renderer.domElement );

	controls = new THREE.OrbitControls( camera, renderer.domElement);

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
		set: function ( x ) { terrain.setOpacity( x ); }
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
		get: function () { return viewMode; },
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

	function _enableLayer( layerTag, name ) {

		Object.defineProperty( viewState, name, {
			writeable: true,
			get: function () { return testCameraLayer( layerTag ); },
			set: function ( x ) { setCameraLayer( layerTag, x ); this.dispatchEvent( { type: "change", name: name } ); }
		} );

	}
	
	function _hasLayer( layerTag, name ) {

		Object.defineProperty( viewState, name, {
			get: function () { return survey.hasFeature( layerTag ); }
		} );

	}

	function _viewStateSetter( modeFunction, name, newMode ) {

		modeFunction( Number( newMode ) );
		viewState.dispatchEvent( { type: "change", name: name } );

	}

}

function setZScale( scale ) {

	// scale - in range 0 - 1

	var lastScale = Math.pow( 2, ( zScale - 0.5 ) * 4 );
	var newScale  = Math.pow( 2, ( scale - 0.5 )  * 4 );

	region.applyMatrix( new THREE.Matrix4().makeScale( 1, 1, newScale / lastScale ) );

	zScale = scale;

}

function renderDepthTexture () {

	if ( terrain == null || !terrain.isLoaded() ) return;

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

	// FIXME - copy direction and scale between cameras

	switch ( mode ) {

	case CV.CAMERA_PERSPECTIVE:

		camera = pCamera;

		break;

	case CV.CAMERA_ORTHOGRAPHIC:

		camera = oCamera;

		break;

	default:

		console.log( "unknown camera mode", mode );
		return;

	}

	controls.object = camera;
	cameraMode = mode;

}

function initCameraLayers ( camera ) {

	camera.layers.set( 0 );

	camera.layers.enable( CV.LEG_CAVE );
	camera.layers.enable( CV.FEATURE_ENTRANCES );
	camera.layers.enable( CV.FEATURE_BOX );
	
	camera.position.set( 0, 0, 600 );
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

	return !( ( oCamera.layers.mask & 1 << layerTag ) === 0 );

}

function setViewMode ( mode ) {

	var position = new  THREE.Vector3();
	
	switch ( mode ) {

	case CV.VIEW_PLAN:

		// reset camera to start position
		position.set( 0, 0, 600 );

		break;

	case CV.VIEW_ELEVATION_N:

		position.set( 0, 600, 0 );

		break;

	case CV.VIEW_ELEVATION_S:

		position.set( 0, -600, 0 );

		break;

	case CV.VIEW_ELEVATION_E:

		position.set( 600, 0, 0 );

		break;

	case CV.VIEW_ELEVATION_W:

		position.set( -600, 0, 0 );

		break;

	default:

		console.log( "invalid view mode specified: ", mode );
		return;

	}

	activePOIPosition = new THREE.Vector3();

	targetPOI = {
		tAnimate: 240,
		position: activePOIPosition,
		cameraPosition: position
	};

	controls.enabled = false;

}

function setTerrainShadingMode ( mode ) {

	var material;

	switch ( mode ) {

	case CV.SHADING_HEIGHT:

		material = CV.Materials.getHeightMaterial( CV.MATERIAL_SURFACE );

		break;

	case CV.SHADING_OVERLAY:

		if (terrain.getOverlays()) terrain.setOverlay( terrain.getOverlay() );

		break;

	case CV.SHADING_CURSOR:

		 material = CV.Materials.getCursorMaterial( CV.MATERIAL_SURFACE, 5.0 );

		 break;

	case CV.SHADING_SHADED:

		material = new THREE.MeshLambertMaterial( {
			color:        0xffffff,
			vertexColors: THREE.VertexColors,
			side:         THREE.FrontSide,
			transparent:  true,
			opacity:      0.5 }
		);

		break;

	case CV.SHADING_PW:

		material = new CV.PWMaterial();

		break;

	default:

		console.log( "unknown mode", mode );
		return;

	}

	if ( material !== undefined ) terrain.setMaterial( material );

	terrainShadingMode = mode;

}

function setShadingMode ( mode ) {

	if ( survey.setShadingMode( mode ) ) {

		//survey.setEntrancesSelected();
		shadingMode = mode;

	}

}

function setSurfaceShadingMode ( mode ) {

	if ( survey.setLegShading( CV.LEG_SURFACE, mode ) ) surfaceShadingMode = mode;

}

function setTerrainOverlay ( overlay ) {

	if ( terrainShadingMode === CV.SHADING_OVERLAY ) terrain.setOverlay( overlay );

}

function cutSection() {

	if ( selectedSection === 0 ) return;

	survey.cutSection( selectedSection );

	// grab a reference to prevent survey being destroyed
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
			position:    box.getWorldPosition(),
			boundingBox: box.geometry.boundingBox

		};

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

	initCameraLayers( pCamera );
	initCameraLayers( oCamera );

	viewState.cameraType = CV.CAMERA_PERSPECTIVE;
	viewState.view       = CV.VIEW_PLAN;

	render();

}

function loadCave ( cave ) {

	if (!cave) {

		alert( "failed loading cave information" );
		return;

	}

	loadSurvey( new CV.Survey( cave ) );

}

function loadSurvey( newSurvey ) {

	survey = newSurvey;

	stats = survey.getStats();

	setScale();

	terrain = survey.getTerrain();

	scene.up = CV.upAxis;
	scene.add( scaleObject( region ) );

	region.add( survey );

	var box = new CV.BoundingBox( survey.limits, 0xffffff );

	box.layers.set( CV.FEATURE_BOX );

	survey.add( box );

	// light the model for Lambert Shaded surface

	directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.copy( CV.lightPosition );

	scene.add( directionalLight );

	scene.add( new THREE.AmbientLight( 0x303030 ) );

	caveIsLoaded = true;

	selectSection( 0 );

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
		renderDepthTexture();

	}

	scene.matrixAutoUpdate = false;

	container.addEventListener( "click", entranceClick, false );

	CV.Hud.setVisibility( true );

	// signal any listeners that we have a new cave
	viewState.dispatchEvent( { type: "newCave", name: "newCave" } );

	controls.object = camera;
	controls.enabled = true;

	
	__dyeTrace(); // FIXME test function

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
			boundingBox: new THREE.Box3().expandByPoint( entrance.position ),
			quaternion:  new THREE.Quaternion()

		};

		activePOIPosition = controls.target;
	
		console.log(entrance.type, entrance.name );

	}

}

function render () {

	if ( !caveIsLoaded ) return;

	var r = camera.getWorldRotation();

	directionalLight.position.copy( CV.lightPosition.clone().applyAxisAngle( CV.upAxis, r.z ) );

	renderer.clear();
	renderer.render( scene, camera );

	var scale = 0;

	if ( camera instanceof THREE.OrthographicCamera ) scale = camera.zoom;

	CV.Hud.render( renderer, camera, scale );

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

		if ( targetPOI.quaternion ) camera.quaternion.slerp( targetPOI.quaternion, t );

		camera.updateProjectionMatrix();

		if ( targetPOI.tAnimate === 0 ) {

			controls.target = targetPOI.position;
			controls.enabled = true;

			// restart the clock to trigger refresh of terrain
			clockStart();
			targetPOI = null;

		}

	}

}

function setCameraPOI ( x ) {

	var boundingBox;
	var elevation;

	if ( targetPOI === null ) return;

	targetPOI.tAnimate = 80;

	var size = targetPOI.boundingBox.size().multiplyScalar( scaleMatrix.elements[ 0 ] ) ;

	if ( camera instanceof THREE.PerspectiveCamera ) {

		var tan = Math.tan( THREE.Math.DEG2RAD * 0.5 * camera.getEffectiveFOV() );

		var e1 = 1.5 * tan * size.y / 2 + size.z;
		var e2 = tan * camera.aspect * size.x / 2 + size.z;

		elevation = Math.max( e1, e2 );
		
		if ( elevation === 0 ) elevation = 100;

	} else {

		elevation = 200; // FIXME

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
	render();

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

function scaleObject( obj ) {

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