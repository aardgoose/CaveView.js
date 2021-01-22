import {
	VERSION,
	FACE_WALLS, FACE_SCRAPS, FEATURE_TRACES, SURVEY_WARNINGS,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE, LABEL_STATION, LABEL_STATION_COMMENT,
	SHADING_PATH, SHADING_DISTANCE,
	FEATURE_BOX, FEATURE_ENTRANCES, FEATURE_TERRAIN, FEATURE_STATIONS,
	VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_E, VIEW_ELEVATION_W, VIEW_PLAN, VIEW_NONE,
	MOUSE_MODE_ROUTE_EDIT, MOUSE_MODE_NORMAL, MOUSE_MODE_DISTANCE, MOUSE_MODE_TRACE_EDIT, MOUSE_MODE_ENTRANCES, TERRAIN_BLEND
} from '../core/constants';

import { HUD } from '../hud/HUD';
import { Materials } from '../materials/Materials';
import { CameraManager } from './CameraManager';
import { LightingManager } from './LightingManager';
import { CameraMove } from './CameraMove';
import { CaveLoader } from '../loaders/CaveLoader';
import { Survey } from './Survey';
import { StationPopup } from './StationPopup';
import { ImagePopup } from './ImagePopup';
import { WebTerrain } from '../terrain/WebTerrain';
import { CommonTerrain } from '../terrain/CommonTerrain';
import { Cfg } from '../core/Cfg';
import { WorkerPoolCache } from '../core/WorkerPool';
import { defaultView, dynamicView, ViewState } from './ViewState';
import { OrbitControls } from '../ui/OrbitControls';
import { LocationControls } from '../ui/LocationControls';

import {
	EventDispatcher,
	Vector3, Euler, Quaternion,
	Scene, Raycaster,
	WebGLRenderer,
	MOUSE, FogExp2,
	WebGLRenderTarget,
	LinearFilter, NearestFilter, RGBAFormat
} from '../Three';

function CaveViewer ( domID, configuration ) {

	console.log( 'CaveView v' + VERSION );

	const container = document.getElementById( domID );

	this.container = container;

	if ( ! container ) alert( 'No container DOM object [' + domID + '] available' );

	// target with css for fullscreen on small screen devices
	container.classList.add( 'cv-container' );

	const cfg = new Cfg( configuration );

	const ctx = {
		cfg: cfg,
		container: container,
		workerPools: new WorkerPoolCache ( cfg ),
		glyphStringCache: new Map(),
		viewer: this
	};

	this.ctx = ctx;

	const materials = new Materials( this );

	ctx.materials = materials;

	container.style.backgroundColor = cfg.themeColorCSS( 'background' );

	var renderer = new WebGLRenderer( { antialias: true, alpha: true } );

	renderer.setSize( container.clientWidth, container.clientHeight );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setClearColor( cfg.themeColor( 'background' ), 0.0 );
	renderer.setRenderTarget( null );
	renderer.clear();
	renderer.autoClear = false;

	container.appendChild( renderer.domElement );

	const fog = new FogExp2( cfg.themeColorCSS( 'background' ), 0.0025 );

	const scene = new Scene();
	scene.fog = fog;
	scene.name = 'CV.Viewer';

	var cameraManager = new CameraManager( ctx, renderer, scene );

	const raycaster = new Raycaster();
	raycaster.layers.enableAll();

	// setup lighting
	const lightingManager = new LightingManager( ctx, scene );

	// setup controllers
	const controls = new OrbitControls( cameraManager, renderer.domElement, this );
	controls.maxPolarAngle = cfg.themeAngle( 'maxPolarAngle' );
	controls.addEventListener( 'change', onCameraMoved );
	controls.addEventListener( 'end', onCameraMoveEnd );

	const locationControls = new LocationControls( cameraManager, ctx );
	locationControls.addEventListener( 'change', onCameraMoved );
	locationControls.addEventListener( 'end', onCameraMoveEnd );
	locationControls.addEventListener( 'accuracy', onLocationAccuracyChange );

	const cameraMove = new CameraMove( controls, onCameraMoved );
	const moveEndEvent = { type: 'moved', cameraManager: cameraManager };

	const formatters = {};

	var caveIsLoaded = false;

	var lastMouseMode = MOUSE_MODE_NORMAL;
	var mouseMode = MOUSE_MODE_NORMAL;
	var mouseTargets = [];
	var clickCount = 0;

	var terrain = null;
	var survey = null;
	var limits = null;
	var stats = {};

	var useFog = false;

	var renderRequired = true;

	var popup = null;

	var clipped = false;

	// preallocated tmp objects

	const __rotation = new Euler();
	const __q = new Quaternion();
	const __v = new Vector3();
	const self = this;

	var viewState;
	var savedView = null;
	var mouseOver = false;

	var hasLocation = false;
	var trackLocation = false;

	// event handler
	window.addEventListener( 'resize', onResize );

	Object.defineProperties( this, {

		'mouseOver': {
			get: function () { return mouseOver; }
		},

		'reset': {
			set: function () { setupView( false ); }
		},

		'surveyLoaded': {
			get: function () { return caveIsLoaded; }
		},

		'terrain': {
			get: function () { return cameraManager.testCameraLayer( FEATURE_TERRAIN ); },
			set: loadTerrain
		},

		'terrainShading': {
			get: function () { return terrain !== null ? terrain.shadingMode : null; },
			set: _stateSetter( setTerrainShadingMode, 'terrainShading')
		},

		'hasTerrain': {
			get: function () { return !! terrain; }
		},

		'hasRealTerrain': {
			get: function () { return ( terrain && ! terrain.isFlat ); }
		},

		'terrainAttributions': {
			get: function () { return terrain !== null ? terrain.attributions : []; }
		},

		'terrainDirectionalLighting': {
			get: function () { return lightingManager.directionalLighting; },
			set: setTerrainLighting
		},

		'terrainThrough': {
			get: function () { return terrain !== null ? terrain.throughMode : null; },
			set: _stateSetter( setTerrainThroughMode, 'terrainThrough' )
		},

		'terrainShadingModes': {
			get: function () { return terrain !== null ? terrain.terrainShadingModes : {}; }
		},

		'terrainTileSet': {
			get: function () { return terrain.tileSet.bind( terrain ); }
		},

		'terrainDatumShift': {
			get: function () { return !! terrain.activeDatumShift; },
			set: applyTerrainDatumShift
		},

		'terrainOpacity': {
			get: function () { return ( terrain !== null ) ? terrain.getOpacity() : 0; },
			set: setTerrainOpacity
		},

		'shadingMode': {
			get: function () { return survey.caveShading; },
			set: _stateSetter( setShadingMode, 'shadingMode' )
		},

		'route': {
			get: function () { return survey.getRoutes().setRoute; },
			set: function ( x ) { survey.getRoutes().setRoute = x; }
		},

		'routeNames': {
			get: function () { return survey.getRoutes().getRouteNames(); },
		},

		'surfaceShading': {
			get: function () { return survey.surfaceShading; },
			set: _stateSetter( setSurfaceShadingMode, 'surfaceShading' )
		},

		'cameraType': {
			get: function () { return cameraManager.mode; },
			set: _stateSetter( setCameraMode, 'cameraType' )
		},

		'eyeSeparation': {
			get: function () { return cameraManager.eyeSeparation; },
			set: setEyeSeparation
		},

		'view': {
			get: function () { return VIEW_NONE; },
			set: _stateSetter( setViewMode, 'view' )
		},

		'cursorHeight': {
			get: function () { return materials.cursorHeight; },
			set: setCursorHeight
		},

		'maxDistance': {
			get: function () { return survey.getMaxDistance(); }
		},

		'maxHeight': {
			get: function () { return ( limits === null ) ? 0 : limits.max.z; }
		},

		'minHeight': {
			get: function () { return ( limits === null ) ? 0 : limits.min.z; }
		},

		'maxLegLength': {
			get: function () { return stats.maxLegLength; }
		},

		'minLegLength': {
			get: function () { return stats.minLegLength; }
		},

		'section': {
			get: function () { return survey.selection.getNode(); },
			set: _stateSetter( selectSection, 'section' )
		},

		'sectionByName': {
			get: getSelectedSectionName,
			set: setSelectedSectionName
		},

		'popup': {
			set: setPopup
		},

		'highlight': {
			set: _stateSetter( highlightSelection, 'highlight' )
		},

		'polarAngle': {
			get: function () { return controls.getPolarAngle(); },
			set: function (x ) { cameraMove.setPolarAngle( x ); }
		},

		'azimuthAngle': {
			set: function ( x ) { cameraMove.setAzimuthAngle( x ); }
		},

		'editMode': {
			get: function () { return mouseMode; },
			set: function ( x ) { setEditMode( x ); self.dispatchEvent( { type: 'change', name: 'editMode' } ); }
		},

		'setPOI': {
			//get: function () { return true; },
			set: _stateSetter( setCameraPOI, 'setPOI' )
		},

		'HUD': {
			get: function () { return hud.getVisibility(); },
			set: function ( x ) { hud.setVisibility( x ); }
		},

		'cut': {
			// get: function () { return true; },
			set: cutSection
		},

		'zScale': {
			get: function () { return survey.zScale; },
			set: setZScale
		},

		'autoRotate': {
			get: function () { return controls.autoRotate; },
			set: function ( x ) { setAutoRotate( !! x ); }
		},

		'wheelTilt': {
			get: function () { return controls.wheelTilt; },
			set: function ( x ) {
				controls.wheelTilt = !! x;
				self.dispatchEvent( { type: 'change', name: 'wheelTilt' } );
			}
		},

		'svxControlMode': {
			get: function () { return controls.svxControlMode; },
			set: function ( x ) {
				controls.svxControlMode = !! x;
				// force refresh of help tab
				self.dispatchEvent( { type: 'newCave', name: 'newCave' } );
			}
		},

		'zoomToCursor': {
			get: function () { return controls.zoomToCursor; },
			set: function ( x ) {
				controls.zoomToCursor = !! x;
				self.dispatchEvent( { type: 'change', name: 'zoomToCursor' } );
			}
		},

		'autoRotateSpeed': {
			get: function () { return controls.autoRotateSpeed / 11; },
			set: setAutoRotateSpeed
		},

		'fullscreen': {
			get: isFullscreen,
			set: setFullscreen
		},

		'hasContours': {
			get: function () { return ! ( renderer.extensions.get( 'OES_standard_derivatives' ) === null ); }
		},

		'fog': {
			get: function () { return useFog; },
			set: setFog
		},

		'isClipped': {
			get: function () { return clipped; }
		},

		'hasLocation': {
			get: function () { return hasLocation; }
		},

		'trackLocation': {
			get: function () { return trackLocation; },
			set: setLocation
		},

		'maxSnapshotSize': {
			get: function () {
				const context = renderer.getContext();
				return context.getParameter( context.MAX_RENDERBUFFER_SIZE );
			}
		},

		'focalLength': {
			get: function () { return cameraManager.focalLength; },
			set: setFocalLength
		}
	} );

	_enableLayer( FEATURE_BOX,       'box' );
	_enableLayer( FEATURE_ENTRANCES, 'entrances' );
	_enableLayer( FEATURE_STATIONS,  'stations' );
	_enableLayer( FEATURE_TRACES,    'traces' );
	_enableLayer( FACE_SCRAPS,       'scraps' );
	_enableLayer( FACE_WALLS,        'walls' );
	_enableLayer( LEG_CAVE,          'legs' );
	_enableLayer( LEG_SPLAY,         'splays' );
	_enableLayer( LEG_SURFACE,       'surfaceLegs' );
	_enableLayer( LABEL_STATION,     'stationLabels' );
	_enableLayer( LABEL_STATION_COMMENT, 'stationComments' );
	_enableLayer( SURVEY_WARNINGS,     'warnings' );

	container.addEventListener( 'mouseover', onMouseOver );
	container.addEventListener( 'mouseleave', onMouseLeave );

	container.addEventListener( 'fullscreenchange', onFullscreenChange );
	container.addEventListener( 'msfullscreenchange', onFullscreenChange );
	container.addEventListener( 'webkitfullscreenchange', onFullscreenChange );

	this.addEventListener( 'change', viewChanged );

	cfg.addEventListener( 'colors', ( e ) => {

		if ( e.name == 'background' ) {

			container.style.backgroundColor = cfg.themeColorCSS( 'background' );
			renderer.setClearColor( cfg.themeColor( 'background' ), 1.0 );

		}

		if ( survey ) survey.refreshColors();

		renderView();

	} );

	function onMouseOver () {

		mouseOver = true;

	}

	function onMouseLeave () {

		mouseOver = false;

	}

	function viewChanged( event ) {

		if ( survey !== null && event.name === 'splays' ) {

			survey.stations.setSplaysVisibility( self.splays );

		}

	}

	this.getControls = function () {

		return controls;

	};

	const hud = new HUD( this, renderer );

	const caveLoader = new CaveLoader( ctx, caveLoaded );

	hud.getProgressDial( 0 ).watch( caveLoader );

	viewState = new ViewState( this );

	this.renderView = renderView;

	onResize();

	function _enableLayer ( layerTag, name ) {

		Object.defineProperty( self, name, {
			get: function () { return cameraManager.testCameraLayer( layerTag ); },
			set: function ( x ) {
				cameraManager.setCameraLayer( layerTag, x );
				self.dispatchEvent( { type: 'change', name: name } );
				renderView();
			}
		} );

		const hasName = 'has' + name.substr( 0, 1 ).toUpperCase() + name.substr( 1 );

		Object.defineProperty( self, hasName, {
			get: function () { return survey.hasFeature( layerTag ); }
		} );

	}

	function _stateSetter ( modeFunction, name ) {

		return function ( newMode ) {

			modeFunction( isNaN( newMode ) ? newMode : Number( newMode ) );
			self.dispatchEvent( { type: 'change', name: name } );

		};

	}

	function setEditMode ( x ) {

		mouseMode = Number( x );
		lastMouseMode = mouseMode;

		clickCount = 0;
		survey.markers.clear();
		survey.selectSection( survey.surveyTree );

		renderView();

		raycaster.params.Points.threshold = 3;

		switch ( mouseMode ) {

		case MOUSE_MODE_TRACE_EDIT:

			mouseTargets = survey.pointTargets.concat( [ survey.dyeTraces ] );

			break;

		case MOUSE_MODE_NORMAL:

			mouseTargets = survey.pointTargets;

			break;

		case MOUSE_MODE_ROUTE_EDIT:

			mouseTargets = survey.legTargets;

			break;

		case MOUSE_MODE_ENTRANCES:

			mouseTargets = survey.entranceTargets;
			raycaster.params.Points.threshold = 15;

			break;

		default:

			console.warn( 'invalid mouse mode', x );

		}

	}

	function isFullscreen () {

		return (
			window.innerHeight === container.clientHeight &&
			window.innerWidth === container.clientWidth
		);

	}

	function onFullscreenChange () {

		if ( document.fullscreenElement || document.msFullscreenElement || document.webkitFullscreenElement ) {

			container.classList.add( 'toggle-fullscreen' );

		} else {

			container.classList.remove( 'toggle-fullscreen' );

		}

		onResize();
		self.dispatchEvent( { type: 'change', name: 'fullscreen' } );

	}

	function setFullscreen ( targetState ) {

		if ( isFullscreen() === targetState ) return;

		if ( targetState ) {

			container.classList.add( 'toggle-fullscreen' );

			if ( document.fullscreenElement === null ) {

				container.requestFullscreen();

			} else if ( document.msfullscreenElement === null) {

				container.msRequestFullscreen();

			} else if ( document.webkitFullscreenElement === null) {

				container.webkitRequestFullscreen();

			}

		} else {

			container.classList.remove( 'toggle-fullscreen' );

			if ( document.fullscreenElement ) {

				document.exitFullscreen();

			} else if ( document.msFullscreenElement ) {

				document.msExitFullscreen();

			} else if ( document.webkitFullscreenElement ) {

				if ( document.webkitExitFullscreen ) {

					document.webkitExitFullscreen();

				} else if ( document.webkitCancelFullScreen ) {

					document.webkitCancelFullScreen();

				}

			}

		}

	}

	function setZScale ( scale ) {

		survey.zScale = scale;
		renderView();

	}

	function setAutoRotate ( state ) {

		cameraMove.setAutoRotate( state );

		self.dispatchEvent( { type: 'change', name: 'autoRotate' } );

	}

	function setAutoRotateSpeed ( speed ) {

		controls.autoRotateSpeed = Math.max( Math.min( speed, 1.0 ), -1.0 ) * 11;

		self.dispatchEvent( { type: 'change', name: 'autoRotateSpeed' } );

	}

	function setCursorHeight ( x ) {

		materials.cursorHeight = x;
		self.dispatchEvent( { type: 'cursorChange', name: 'cursorHeight' } );

		renderView();

	}

	function setTerrainShadingMode ( mode ) {

		if ( survey.terrain === null ) return;

		terrain.setShadingMode( mode, renderView );

		renderView();

		if ( terrain.isTiled ) terrain.zoomCheck( cameraManager );

	}

	function setTerrainThroughMode ( mode ) {

		if ( terrain === null ) return;

		terrain.setThroughMode( mode );

		materials.distanceTransparency = mode === TERRAIN_BLEND ? 200 : 0;

		setTerrainShadingMode( terrain.shadingMode );

	}

	function setTerrainOpacity ( x ) {

		if ( terrain === null ) return;

		terrain.setOpacity( x );
		self.dispatchEvent( { type: 'change', name: 'terrainOpacity' } );

		renderView();

	}

	function setTerrainLighting ( on ) {

		lightingManager.directionalLighting = on;

		renderView();

	}

	function applyTerrainDatumShift ( x ) {

		if ( terrain === null ) return;

		terrain.applyDatumShift( x );
		self.dispatchEvent( { type: 'change', name: 'terrainDatumShift' } );

		renderView();

	}

	function setupTerrain ( newTerrain ) {

		if ( newTerrain.isLoaded ) {

			terrain = newTerrain;

			terrain.setup( renderer, scene, survey );

			if ( cfg.value( 'useGPS', false ) ) {

				locationControls.hasLocation( survey, locationChecked );

			}

			if ( terrain.isTiled ) {

				terrain.addEventListener( 'progress', onEnd );
				terrain.watch( self );

			}

		}

		setupView( true );

	}

	function locationChecked () {

		hasLocation = true;
		self.dispatchEvent( { type: 'newCave', name: 'newCave' } );

	}

	function setLocation ( x ) {

		if ( x ) {

			savedView = viewState.saveState();

			controls.saveState();

			locationControls.connect();

			self.setView( dynamicView, null );
			cameraMove.cancel();


		} else {

			// disable location controls
			locationControls.disconnect();

			if ( terrain !== null ) terrain.setScale( 0.0 );

			// restore previous settings
			self.setView( savedView, null );

			// setting the saved view may attempt to reset this.view
			cameraMove.cancel();

			controls.reset();

			savedView = null;

		}

		controls.enabled = ! x;
		trackLocation = x;

		renderView();

	}

	function onLocationAccuracyChange ( event ) {

		terrain.setAccuracy( event.value );

	}

	function setCameraMode ( mode ) {

		cameraManager.setCamera( mode, controls.target );

		renderView();

	}

	function setFocalLength( f ) {

		const fChange = f / cameraManager.focalLength;

		cameraManager.focalLength = f;

		// adjust camera position to maintain view
		controls.scaleDolly( fChange );

	}

	function onCameraMoved () {

		const camera = cameraManager.activeCamera;

		__rotation.setFromQuaternion( camera.getWorldQuaternion( __q ) );

		lightingManager.setRotation( __rotation );

		if ( trackLocation && terrain !== null ) {

			if ( camera.isOrthographicCamera ) {

				terrain.setScale( camera.zoom * survey.scale.z );
				terrain.setTarget( locationControls.location );

			} else {

				terrain.setScale( 0.0 );

			}

		}

		renderView();

	}

	function setEyeSeparation ( x ) {

		cameraManager.eyeSeparation = x;
		renderView();

	}

	function setViewMode ( mode ) {

		const targetAxis = __v;

		switch ( mode ) {

		case VIEW_NONE:

			return;

		case VIEW_PLAN:

			targetAxis.set( 0, 0, -1 );

			break;

		case VIEW_ELEVATION_N:

			targetAxis.set( 0, 1, 0 );

			break;

		case VIEW_ELEVATION_S:

			targetAxis.set( 0, -1, 0 );

			break;

		case VIEW_ELEVATION_E:

			targetAxis.set( 1, 0, 0 );

			break;

		case VIEW_ELEVATION_W:

			targetAxis.set( -1, 0, 0 );

			break;

		default:

			console.warn( 'invalid view mode specified: ', mode );
			return;

		}

		cameraMove.prepare( survey.getWorldBoundingBox(), targetAxis );
		cameraMove.start( renderRequired );

	}

	function setFog ( enable ) {

		useFog = enable;
		fog.density = useFog ? 0.0025 : 0;

		renderView();

	}

	function setShadingMode ( mode ) {

		const shadingMode = survey.setShadingMode( mode );

		if ( shadingMode === SHADING_DISTANCE ) {

			lastMouseMode = mouseMode;
			mouseMode = MOUSE_MODE_DISTANCE;
			mouseTargets = survey.pointTargets;

		} else {

			mouseMode = lastMouseMode;

		}

		renderView();

	}

	function setSurfaceShadingMode ( mode ) {

		survey.setSurfaceShading( mode );

		renderView();

	}

	this.addOverlay = function ( name, overlayProvider, locationDefault ) {

		CommonTerrain.addOverlay( ctx, name, overlayProvider, locationDefault );

	};

	this.addFormatters = function ( stationFormatter ) {

		formatters.station = stationFormatter;

	};

	function cutSection () {

		const selection = survey.selection;

		if ( selection.isEmpty() || selection.isStation() ) return;

		cameraMove.cancel();

		survey.remove( terrain );
		survey.cutSection( selection.getNode() );

		// grab a reference to prevent survey being destroyed in clearView()
		const cutSurvey = survey;

		savedView = viewState.saveState();

		// reset view
		self.clearView();

		clipped = true;

		loadSurvey( cutSurvey );

	}

	function highlightSelection ( node ) {

		survey.highlightSelection( node );

		renderView();

	}

	function selectSection ( node ) {

		if ( node.isStation() ) {

			_selectStation( node );

		} else {

			_selectSection( node );

		}

		renderView();

		return;

		function _selectSection ( node ) {

			survey.selectSection( node );

			cameraMove.cancel();
			cameraMove.prepare( survey.selection.getWorldBoundingBox() );

			if ( survey.selection.isEmpty() ) cameraMove.start( renderRequired );

			return;

		}

		function _selectStation ( node ) {

			if ( mouseMode === MOUSE_MODE_TRACE_EDIT ) {

				selectTraceStation( node );

			} else {

				survey.selectStation( node );

				cameraMove.preparePoint( survey.getWorldPosition( node.p.clone() ) );

			}

		}

	}

	function getSelectedSectionName () {

		return survey.selection.getName();

	}

	function setSelectedSectionName ( name ) {

		selectSection( survey.surveyTree.getByPath( name ) || survey.surveyTree );

	}

	function onResize () {

		// adjust the renderer to the new canvas size
		const w = container.clientWidth;
		const h = container.clientHeight;

		renderer.setSize( w, h );

		self.dispatchEvent( { type: 'resized', name: 'rts', 'width': w, 'height': h } );

		renderView();

	}

	this.clearView = function () {

		// clear the current cave model, and clear the screen
		caveIsLoaded = false;

		renderer.clear();

		hud.setVisibility( false );

		// terminate all running workers (tile loading/wall building etc)
		ctx.workerPools.terminateActive();

		if ( terrain && terrain.isTiled ) {

			terrain.unwatch( self );

		}

		scene.remove( survey );

		controls.enabled = false;

		survey          = null;
		terrain         = null;
		limits          = null;
		mouseMode       = MOUSE_MODE_NORMAL;
		mouseTargets    = [];
		hasLocation     = false;

		// remove event listeners

		container.removeEventListener( 'mousedown', onMouseDown );

		cameraManager.resetCameras();

		controls.reset();

	};

	this.loadCave = function ( file, section ) {

		caveLoader.reset();
		caveLoader.loadFile( file, section );

		clipped = ( section !== undefined && section != '' );

	};

	this.loadCaves = function ( files ) {

		caveLoader.reset();
		caveLoader.loadFiles( files );

	};

	function caveLoaded ( cave ) {

		if ( ! cave ) {

			alert( 'failed loading cave information' );
			return;

		}

		onResize();
		loadSurvey( new Survey( ctx, cave ) );
		caveLoader.reset();

	}

	this.setView = function ( properties1, properties2 ) {

		// don't render until all settings made.
		if ( ! renderRequired ) return;

		renderRequired = false;

		Object.assign( this, properties1, properties2 );

		renderRequired = true;

		renderView();

	};

	function setupView ( final ) {

		renderRequired = true;

		if ( savedView === null ) {

			self.setView( defaultView, cfg.value( 'view', {} ) );

		} else {

			self.setView( savedView );
			savedView = null;

		}

		if ( final ) {

			// signal any listeners that we have a new cave

			self.dispatchEvent( { type: 'newCave', name: 'newCave' } );

		}

	}

	function loadSurvey ( newSurvey ) {

		// only render after first SetupView()
		renderRequired = false;

		survey = newSurvey;

		hud.getProgressDial( 1 ).watch( survey );

		stats = self.getLegStats( LEG_CAVE );

		setScale();

		materials.flushCache();

		scene.addStatic( survey );

		mouseTargets = survey.pointTargets;

		scene.matrixAutoUpdate = false;

		container.addEventListener( 'mousedown', onMouseDown, false );

		controls.enabled = true;

		survey.getRoutes().addEventListener( 'changed', onSurveyChanged );
		survey.addEventListener( 'changed', onSurveyChanged );

		caveIsLoaded = true;

		// have we got built in terrain
		let terrain = survey.terrain;

		if ( terrain !== null ) {

			setupTerrain( terrain );

		} else if ( navigator.onLine ) {

			terrain = new WebTerrain( ctx, survey, setupTerrain );

			hud.getProgressDial( 0 ).watch( terrain );

			setupView( false );

		} else {

			setupView( true );

		}

	}

	function onEnd ( event ) {

		if ( event.name === 'end' ) renderView();

	}

	function onSurveyChanged ( /* event */ ) {

		setShadingMode( survey.caveShading );

	}

	function loadTerrain ( mode ) {

		if ( terrain !== null && terrain.isLoaded ) {

			terrain.setVisibility( mode );

			cameraManager.setCameraLayer( FEATURE_TERRAIN, mode );

			self.dispatchEvent( { type: 'change', name: 'terrain' } );

			renderView();

		}

	}

	function showStationImagePopup ( station, imageUrl ) {

		if ( popup !== null ) return;

		popup = new ImagePopup( ctx, station, imageUrl, renderView );
		survey.add( popup );

		renderView();

	}

	function showStationPopup ( station ) {

		if ( popup !== null ) return;

		const depth = ( terrain ) ? station.p.z - terrain.getHeight( station.p ) : null;

		popup = new StationPopup( ctx, station, survey, depth, formatters.station, ( survey.caveShading === SHADING_DISTANCE ), self.warnings );
		survey.add( popup );

		renderView();

	}

	function closePopup () {

		if ( popup === null ) return;

		popup.close();
		popup = null;

	}

	function mouseUpLeft () {

		container.removeEventListener( 'mouseup', mouseUpLeft );

		closePopup();
		renderView();

		self.dispatchEvent( { type: 'select', node: null } );

	}


	function setPopup ( station ) {

		closePopup();

		if ( station.isStation() ) showStationPopup( station );

	}

	this.getStation = function ( mouse ) {

		const threshold = raycaster.params.Points.threshold;

		raycaster.setFromCamera( mouse, cameraManager.activeCamera );
		raycaster.params.Points.threshold = 20;

		const intersects = raycaster.intersectObjects( survey.pointTargets, false );

		raycaster.params.Points.threshold = threshold;

		if ( intersects.length < 1 ) return null;

		const station = visibleStation( intersects );

		if ( station === null ) return null;

		return survey.getWorldPosition( station.p.clone() );

	};

	function onMouseDown ( event ) {

		if ( event.target !== renderer.domElement ) return;

		const scale = __v.set( container.clientWidth / 2, container.clientHeight / 2, 0 );
		const mouse = cameraManager.getMouse( event.clientX, event.clientY );

		raycaster.setFromCamera( mouse, cameraManager.activeCamera );
		const intersects = raycaster.intersectObjects( mouseTargets, false );

		var entrance;

		if ( mouseMode === MOUSE_MODE_NORMAL && self.entrances ) {

			entrance = survey.entrances.intersectLabels( mouse, cameraManager.activeCamera, scale );

			if ( entrance !== null ) {

				const station = survey.surveyTree.findById( entrance.stationID );

				const e = {
					type: 'entrance',
					node: station,
					handled: false,
					mouseEvent: event
				};

				self.dispatchEvent( e );

				if ( e.handled ) return;

				_selectStation( station );
				return;

			}

		}

		if ( intersects.length < 1 ) return;

		switch ( mouseMode ) {

		case MOUSE_MODE_NORMAL:

			_selectStation( visibleStation( intersects ) );

			break;

		case MOUSE_MODE_ROUTE_EDIT:

			_selectSegment( intersects[ 0 ] );

			break;

		case MOUSE_MODE_DISTANCE:

			_selectDistance( visibleStation( intersects ) );

			break;

		case MOUSE_MODE_TRACE_EDIT:

			if ( event.button === MOUSE.LEFT ) {

				if ( intersects[ 0 ].object.type === 'Mesh' ) {

					selectTrace( intersects[ 0 ] );

				} else {

					selectTraceStation( visibleStation( intersects ) );

				}

			}

			break;
		/*
		case MOUSE_MODE_ENTRANCES:

			selectEntrance( intersects[ 0 ] );

			break;

		*/

		}

		function _selectStation ( station ) {

			if ( station === null ) return;

			survey.selectStation( station );

			const selectEvent = {
				type: 'select',
				node: station,
				handled: false,
				mouseEvent: event
			};

			self.dispatchEvent( selectEvent );

			if ( selectEvent.handled ) return;

			if ( event.button === MOUSE.LEFT ) {

				_showStationPopup( station );

			} else if ( event.button === MOUSE.RIGHT ) {

				_setStationPOI( station );

			}


		}

		function _setStationPOI( station ) {

			if ( ! survey.selection.contains( station.id ) ) {

				survey.selectSection( survey.surveyTree );

			}

			selectSection( station );

			cameraMove.start( true );
			event.stopPropagation();

			container.addEventListener( 'mouseup', _mouseUpRight );

		}

		function _selectDistance ( station ) {

			if ( station === null ) return;

			if ( event.button === MOUSE.LEFT ) {

				survey.showShortestPath( station );

				_showStationPopup( station );

			} else if ( event.button === MOUSE.RIGHT ) {

				survey.shortestPathSearch( station );

				self.dispatchEvent( { type: 'change', name: 'shadingMode' } );
				renderView();

			}

		}

		function _showStationPopup ( station ) {

			showStationPopup( station );

			container.addEventListener( 'mouseup', mouseUpLeft );
			cameraMove.preparePoint( survey.getWorldPosition( station.p.clone() ) );

			return true;

		}

		function _selectSegment ( picked ) {

			survey.getRoutes().toggleSegment( picked.index );

			setShadingMode( SHADING_PATH );

			renderView();

			return true;

		}

		function _mouseUpRight ( /* event */ ) {

			container.removeEventListener( 'mouseup', _mouseUpRight );

			if ( ! trackLocation ) controls.enabled = true;

			renderView();

			self.dispatchEvent( { type: 'select', node: null } );

		}

	}

	/*

	function selectEntrance ( hit ) {

		const entrances = survey.entrances;
		const info = entrances.getStation( hit.index );

		self.dispatchEvent( {
			type: 'selectedEntrance',
			entrance: info
		} );

	}

	*/

	function selectTrace ( hit ) {

		const dyeTraces = survey.dyeTraces;
		const traceIndex = hit.faceIndex;

		survey.markers.clear();

		dyeTraces.outlineTrace( traceIndex );

		self.dispatchEvent( {
			type: 'selectedTrace',
			trace: dyeTraces.getTraceStations( traceIndex ),
			delete: function _deleteTrace () {
				dyeTraces.deleteTrace( traceIndex );
				renderView();
			}
		} );

		renderView();

	}

	function selectTraceStation ( station ) {

		if ( station === null ) return;

		const dyeTraces = survey.dyeTraces;
		const markers = survey.markers;

		dyeTraces.outlineTrace( null );

		if ( ++clickCount === 3 ) {

			markers.clear();
			clickCount = 1;

		}

		markers.mark( station );

		const list = markers.getStations();

		var start, end;

		if ( list[ 0 ] !== undefined ) start = list[ 0 ].getPath();
		if ( list[ 1 ] !== undefined ) end = list[ 1 ].getPath();

		self.dispatchEvent( {
			type: 'selectedTrace',
			start: start,
			end: end,
			add: function () {
				if ( list.length !== 2 ) return;

				dyeTraces.addTrace( list[ 0 ], list[ 1 ] );

				markers.clear();
				renderView();

			}
		} );

		renderView();

	}

	function visibleStation ( intersects ) {

		return survey.stations.getClosestVisibleStation( cameraManager.activeCamera, intersects );

	}

	function renderView () {

		if ( ! renderRequired ) return;

		renderer.clear();

		if ( caveIsLoaded ) {

			survey.update( cameraManager, controls.target, ! trackLocation );

			if ( useFog ) materials.setFog( true );

			cameraManager.activeRenderer();

		}

		if ( useFog ) materials.setFog( false );

		hud.renderHUD();

	}

	this.renderView = renderView;

	function onCameraMoveEnd () {

		self.dispatchEvent( moveEndEvent );

	}

	function setCameraPOI () {

		cameraMove.start( true );

	}

	function setScale () {

		const width  = container.clientWidth;
		const height = container.clientHeight;

		// scaling to compensate distortion introduced by projection ( x and y coords only ) - approx only
		const scaleFactor = survey.scaleFactor;

		limits = survey.limits;

		const range = survey.combinedLimits.getSize( __v );

		var hScale = Math.min( width / range.x, height / range.y );

		if ( hScale === Infinity ) hScale = 1;

		const vScale = hScale * scaleFactor;

		survey.setScale( hScale, vScale );

		hud.setScale( vScale );

	}

	this.getLegStats = function ( type ) {

		const legs = survey.getFeature( type );

		return ( legs !== undefined ) ? survey.getFeature( type ).stats : {
			legs: 0,
			legLength: 0,
			minLegLength: 0,
			maxLegLength: 0
		};

	};

	this.getControls = function () {

		return controls;

	};

	this.getMetadata = function () {

		return survey.metadata;

	};

	this.getGLTFExport = function ( selection, options, callback ) {

		survey.gltfExport( selection, options, callback );

	};

	this.getSurveyTree = function () {

		return survey.surveyTree;

	};

	this.showImagePopup = function ( event, imageUrl ) {

		showStationImagePopup( event.node, imageUrl );
		container.addEventListener( 'mouseup', mouseUpLeft );

	};

	this.getSnapshot = function ( exportSize, lineScale ) {

		var width  = container.clientWidth;
		var height = container.clientHeight;

		var newWidth = exportSize;
		var newHeight = Math.round( height * newWidth / width );

		const renderTarget = new WebGLRenderTarget( newWidth, newHeight, { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat, stencilBuffer: true } );

		renderTarget.texture.generateMipmaps = false;
		renderTarget.texture.name = 'CV.snapshot';

		renderer.setSize( newWidth, newHeight );
		renderer.setPixelRatio( 1 );

		renderer.setRenderTarget( renderTarget );

		// reset camera and materials using renderer size/resolution
		self.dispatchEvent( { type: 'resized', name: 'rts', 'width': newWidth, 'height': newHeight, lineScale: lineScale } );

		renderView();

		const bSize = newWidth * newHeight * 4;
		const buffer = new Uint8ClampedArray( bSize );

		// restore renderer to normal render size and target
		renderer.readRenderTargetPixels( renderTarget, 0, 0, newWidth, newHeight, buffer );

		// invert image
		const line = newWidth * 4;
		const invertedBuffer = new Uint8ClampedArray( bSize );

		for ( let i = 0; i < bSize; i += line ) {

			const dst = bSize - i - line;

			for ( let j = 0; j < line; j++ ) {

				invertedBuffer[ dst + j ] = buffer[ i + j ];

			}

		}

		const id = new ImageData( invertedBuffer, newWidth, newHeight );

		var canvas = document.createElement( 'canvas' );

		canvas.width = newWidth;
		canvas.height = newHeight;

		var ctx = canvas.getContext( '2d' );

		ctx.putImageData( id, 0, 0 );

		renderTarget.dispose();

		renderer.setRenderTarget( null );
		renderer.setPixelRatio( window.devicePixelRatio );

		// reset renderer etc to new sizes

		onResize();

		return canvas.toDataURL();

	};

	this.dispose = function () {

		ctx.workerPools.dispose();
		scene.remove( survey );
		controls.dispose();
		locationControls.dispose();
		hud.dispose();

		ctx.glyphStringCache = null;
		ctx.cfg = null;
		ctx.workerPools = null;
		ctx.materials = null;
		ctx.container = null;

		window.removeEventListener( 'resize', onResize );

		container.removeChild( renderer.domElement );

		container.removeEventListener( 'mouseover', onMouseOver );
		container.removeEventListener( 'mouseleave', onMouseLeave );
		container.removeEventListener( 'mousedown', onMouseDown );

		container.removeEventListener( 'fullscreenchange', onFullscreenChange );
		container.removeEventListener( 'msfullscreenchange', onFullscreenChange );

		renderer.clear();
		renderer.dispose();

		renderer = null;

	};

}

CaveViewer.prototype = Object.create( EventDispatcher.prototype );

export { CaveViewer };