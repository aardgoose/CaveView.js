
import {
	VERSION,
	FACE_WALLS, FACE_SCRAPS, FEATURE_TRACES, SURVEY_WARNINGS,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE, LABEL_STATION, LABEL_STATION_COMMENT,
	SHADING_SINGLE, SHADING_RELIEF, SHADING_PATH, SHADING_DISTANCE,
	FEATURE_BOX, FEATURE_ENTRANCES, FEATURE_TERRAIN, FEATURE_STATIONS,
	VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_E, VIEW_ELEVATION_W, VIEW_PLAN, VIEW_NONE,
	MOUSE_MODE_ROUTE_EDIT, MOUSE_MODE_NORMAL, MOUSE_MODE_DISTANCE, MOUSE_MODE_TRACE_EDIT, MOUSE_MODE_ENTRANCES, MOUSE_MODE_ANNOTATE, FEATURE_ANNOTATIONS
} from '../core/constants';

import { HUD } from '../hud/HUD';
import { Materials } from '../materials/Materials';
import { CameraManager } from './CameraManager';
import { LightingManager } from './LightingManager';
import { CameraMove } from './CameraMove';
import { CaveLoader } from '../loaders/CaveLoader';
import { Survey } from './Survey';
import { StationPopup } from './StationPopup';
import { WebTerrain } from '../terrain/WebTerrain';
import { CommonTerrain } from '../terrain/CommonTerrain';
import { Cfg } from '../core/lib';
import { WorkerPool } from '../core/WorkerPool';
import { defaultView, dynamicView, ViewState } from './ViewState';

// import { Annotations } from './Annotations';

import { OrbitControls } from '../ui/OrbitControls';
import { LocationControls } from '../ui/LocationControls';

import {
	EventDispatcher,
	Vector3, Euler, Quaternion,
	Scene, Raycaster,
	WebGLRenderer,
	MOUSE, FogExp2
} from '../Three';

function CaveViewer ( domID, configuration ) {

	console.log( 'CaveView v' + VERSION );

	const container = document.getElementById( domID );

	if ( ! container ) alert( 'No container DOM object [' + domID + '] available' );

	const width = container.clientWidth;
	const height = container.clientHeight;

	Cfg.set( configuration );

	container.style.backgroundColor = Cfg.themeValue( 'background' );

	const renderer = new WebGLRenderer( { antialias: true, alpha: true });
	renderer.setSize( width, height );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setClearColor( Cfg.themeValue( 'background' ) );
	renderer.autoClear = false;
	renderer.setClearAlpha( 0.0 );
	renderer.setRenderTarget( null );
	renderer.clear();

	container.appendChild( renderer.domElement );

	const fog = new FogExp2( Cfg.themeValue( 'background' ), 0.0025 );

	const scene = new Scene();
	scene.fog = fog;
	scene.name = 'CV.Viewer';

	const cameraManager = new CameraManager( container, renderer, scene );

	const raycaster = new Raycaster();
	raycaster.params.Points.threshold = 2;

	// setup lighting
	const lightingManager = new LightingManager( scene );

	// setup controllers
	const controls = new OrbitControls( cameraManager, renderer.domElement, this );
	controls.maxPolarAngle = Cfg.themeAngle( 'maxPolarAngle' );
	controls.addEventListener( 'change', cameraMoved );
	controls.addEventListener( 'end', onCameraMoveEnd );

	const locationControls = new LocationControls( cameraManager );
	locationControls.addEventListener( 'change', cameraMoved );
	locationControls.addEventListener( 'end', onCameraMoveEnd );
	locationControls.addEventListener( 'accuracy', onLocationAccuracyChange );

	const cameraMove = new CameraMove( controls, cameraMoved );

	const formatters = {};

	const RETILE_TIMEOUT = 80; // ms pause after last movement before attempting retiling

	var caveIsLoaded = false;

	var lastMouseMode = MOUSE_MODE_NORMAL;
	var mouseMode = MOUSE_MODE_NORMAL;
	var mouseTargets = [];
	var clickCount = 0;

	var terrain = null;
	var survey;
	var limits = null;
	var stats = {};
	var caveLoader;

	var shadingMode = SHADING_SINGLE;
	var surfaceShadingMode = SHADING_SINGLE;
	var terrainShadingMode = SHADING_RELIEF;

	var useFog = false;

	var selectedSection = null;

	var renderRequired = true;

	var lastActivityTime = 0;
	var timerId = null;
	var retileScaler = 1;

	var popup = null;

	var clipped = false;

	// preallocated tmp objects

	const __rotation = new Euler();
	const __q = new Quaternion();
	const __v = new Vector3();
	const self = this;

	var viewState;
	var savedView = null;
	var hud;

	var hasLocation = false;
	var trackLocation = false;

	// event handler
	window.addEventListener( 'resize', resize );

	Object.defineProperties( this, {

		'container': {
			value: container
		},

		'reset': {
			writeable: true,
			set: function () { setupView( false ); }
		},

		'surveyLoaded': {
			get: function () { return caveIsLoaded; }
		},

		'terrain': {
			writeable: true,
			get: function () { return cameraManager.testCameraLayer( FEATURE_TERRAIN ); },
			set: loadTerrain
		},

		'terrainShading': {
			writeable: true,
			get: function () { return terrainShadingMode; },
			set: _stateSetter( setTerrainShadingMode, 'terrainShading')
		},

		'hasTerrain': {
			get: function () { return !! terrain; }
		},

		'hasRealTerrain': {
			get: function () { return ( terrain && ! terrain.isFlat ); }
		},

		'terrainAttributions': {
			get: function () { return terrain.attributions; }
		},

		'terrainDirectionalLighting': {
			writeable: true,
			get: function () { return lightingManager.directionalLighting; },
			set: setTerrainLighting
		},

		'terrainThrough': {
			writeable: true,
			get: function () { return terrain.throughMode; },
			set: _stateSetter( setTerrainThroughMode, 'terrainThrough' )
		},

		'terrainShadingModes': {
			get: function () { return terrain.terrainShadingModes; }
		},

		'terrainTileSet': {
			get: function () { return terrain.tileSet.bind( terrain ); }
		},

		'terrainDatumShift': {
			writeable: true,
			get: function () { return !! terrain.activeDatumShift; },
			set: applyTerrainDatumShift
		},

		'terrainOpacity': {
			writeable: true,
			get: function () { return ( terrain !== null ) ? terrain.getOpacity() : 0; },
			set: setTerrainOpacity
		},

		'shadingMode': {
			writeable: true,
			get: function () { return shadingMode; },
			set: _stateSetter( setShadingMode, 'shadingMode' )
		},

		'route': {
			writeable: true,
			get: function () { return survey.getRoutes().setRoute; },
			set: function ( x ) { survey.getRoutes().setRoute = x; }
		},

		'routeNames': {
			get: function () { return survey.getRoutes().getRouteNames(); },
		},

		'surfaceShading': {
			writeable: true,
			get: function () { return surfaceShadingMode; },
			set: _stateSetter( setSurfaceShadingMode, 'surfaceShading' )
		},

		'cameraType': {
			writeable: true,
			get: function () { return cameraManager.mode; },
			set: _stateSetter( setCameraMode, 'cameraType' )
		},

		'eyeSeparation': {
			writeable: true,
			get: function () { return cameraManager.eyeSeparation; },
			set: setEyeSeparation
		},

		'view': {
			writeable: true,
			get: function () { return VIEW_NONE; },
			set: _stateSetter( setViewMode, 'view' )
		},

		'cursorHeight': {
			writeable: true,
			get: function () { return Materials.cursorHeight; },
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
			writeable: true,
			get: function () { return selectedSection; },
			set: _stateSetter( selectSection, 'section' )
		},

		'sectionByName': {
			writeable: true,
			get: getSelectedSectionName,
			set: setSelectedSectionName
		},

		'highlight': {
			writeable: true,
			set: _stateSetter( highlightSelection, 'highlight' )
		},

		'polarAngle': {
			writeable: true,
			get: function () { return controls.getPolarAngle(); },
			set: function (x ) { cameraMove.setPolarAngle( x ); }
		},

		'azimuthAngle': {
			writeable: true,
			set: function ( x ) { cameraMove.setAzimuthAngle( x ); }
		},

		'editMode': {
			writeable: true,
			get: function () { return mouseMode; },
			set: function ( x ) { setEditMode( x ); self.dispatchEvent( { type: 'change', name: 'editMode' } ); }
		},

		'setPOI': {
			writeable: true,
			//get: function () { return true; },
			set: _stateSetter( setCameraPOI, 'setPOI' )
		},

		'HUD': {
			writeable: true,
			get: function () { return hud.getVisibility(); },
			set: function ( x ) { hud.setVisibility( x ); }
		},

		'cut': {
			writeable: true,
			// get: function () { return true; },
			set: cutSection
		},

		'zScale': {
			writeable: true,
			get: function () { return survey.zScale; },
			set: setZScale
		},

		'autoRotate': {
			writeable: true,
			get: function () { return controls.autoRotate; },
			set: function ( x ) { setAutoRotate( !! x ); }
		},

		'wheelTilt': {
			writeable: true,
			get: function () { return controls.wheelTilt; },
			set: function ( x ) {
				controls.wheelTilt = !! x;
				self.dispatchEvent( { type: 'change', name: 'wheelTilt' } );
			}
		},

		'svxControlMode': {
			writeable: true,
			get: function () { return controls.svxControlMode; },
			set: function ( x ) {
				controls.svxControlMode = !! x;
				// force refresh of help tab
				self.dispatchEvent( { type: 'newCave', name: 'newCave' } );
			}
		},

		'zoomToCursor': {
			writeable: true,
			get: function () { return controls.zoomToCursor; },
			set: function ( x ) {
				controls.zoomToCursor = !! x;
				self.dispatchEvent( { type: 'change', name: 'zoomToCursor' } );
			}
		},

		'autoRotateSpeed': {
			writeable: true,
			get: function () { return controls.autoRotateSpeed / 11; },
			set: setAutoRotateSpeed
		},

		'fullscreen': {
			writeable: true,
			get: isFullscreen,
			set: setFullscreen
		},

		'hasContours': {
			get: function () { return ! ( renderer.extensions.get( 'OES_standard_derivatives' ) === null ); }
		},

		'fog': {
			writeable: true,
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
			writeable: true,
			get: function () { return trackLocation; },
			set: setLocation
		}

	} );

	_enableLayer( FEATURE_BOX, 'box' );

	_conditionalLayer( FEATURE_ENTRANCES, 'entrances' );
	_conditionalLayer( FEATURE_STATIONS,  'stations' );
	_conditionalLayer( FEATURE_TRACES,    'traces' );
	_conditionalLayer( FACE_SCRAPS,       'scraps' );
	_conditionalLayer( FACE_WALLS,        'walls' );
	_conditionalLayer( LEG_CAVE,          'legs' );
	_conditionalLayer( LEG_SPLAY,         'splays' );
	_conditionalLayer( LEG_SURFACE,       'surfaceLegs' );
	_conditionalLayer( LABEL_STATION,     'stationLabels' );
	_conditionalLayer( LABEL_STATION_COMMENT, 'stationComments' );
	_conditionalLayer( FEATURE_ANNOTATIONS, 'annotations' );
	_conditionalLayer( SURVEY_WARNINGS,     'warnings' );

	Materials.initCache( this );

	this.getControls = function () {

		return controls;

	};

	hud = new HUD( this, renderer );

	caveLoader = new CaveLoader( caveLoaded );

	hud.getProgressDial( 0 ).watch( caveLoader );

	// check if we are defaulting to full screen
	if ( isFullscreen() ) setBrowserFullscreen( true );

	viewState = new ViewState( this );

	function _enableLayer ( layerTag, name ) {

		Object.defineProperty( self, name, {
			writeable: true,
			get: function () { return cameraManager.testCameraLayer( layerTag ); },
			set: function ( x ) { setCameraLayer( layerTag, x ); self.dispatchEvent( { type: 'change', name: name } ); }
		} );

	}

	function _conditionalLayer ( layerTag, name ) {

		_enableLayer ( layerTag, name );

		name = 'has' + name.substr( 0, 1 ).toUpperCase() + name.substr( 1 );

		Object.defineProperty( self, name, {
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
		survey.clearSelection();

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

		case MOUSE_MODE_ANNOTATE:

			mouseTargets = survey.pointTargets;

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

	function setFullscreen ( targetState ) {

		if ( isFullscreen() !== targetState ) {

			container.classList.toggle( 'toggle-fullscreen' );

			setBrowserFullscreen( targetState );

			resize();

			self.dispatchEvent( { type: 'change', name: 'fullscreen' } );

		}

	}

	function setBrowserFullscreen ( targetState ) {

		if ( targetState ) {

			if ( container.webkitRequestFullscreen ) {
				container.webkitRequestFullscreen();
			} else if ( container.mozRequestFullScreen ) {
				container.mozRequestFullScreen();
			} else if ( container.msRequestFullscreen ) {
				container.msRequestFullscreen();
			}

		} else {

			if ( document.webkitExitFullscreen ) {
				document.webkitExitFullscreen();
			} else if ( document.mozCancelFullScreen ) {
				document.mozCancelFullScreen();
			} else if ( document.msExitFullscreen ) {
				document.msExitFullscreen();
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

		Materials.cursorHeight = x;
		self.dispatchEvent( { type: 'cursorChange', name: 'cursorHeight' } );

		renderView();

	}

	function setTerrainShadingMode ( mode ) {

		if ( survey.terrain === null ) return;

		if ( terrain.setShadingMode( mode, renderView ) ) terrainShadingMode = mode;

		renderView();

		if ( terrain.isTiled ) updateTerrain();

	}

	function setTerrainThroughMode ( mode ) {

		if ( terrain === null ) return;

		terrain.setThroughMode( mode );

		setTerrainShadingMode( terrainShadingMode );

	}

	function setTerrainOpacity ( x ) {

		if ( terrain === null ) return;

		terrain.setOpacity( x );
		self.dispatchEvent( { type: 'change', name: 'terrainOpacity' } );

		renderView();

	}

	function setTerrainLighting( on ) {

		lightingManager.directionalLighting = on;

		renderView();

	}

	function applyTerrainDatumShift( x ) {

		if ( terrain === null ) return;

		terrain.applyDatumShift( x );
		self.dispatchEvent( { type: 'change', name: 'terrainDatumShift' } );

		renderView();

	}

	function setupTerrain () {

		if ( ! terrain.isLoaded ) return;

		survey.addStatic( terrain );

		terrain.setup( renderer, scene, survey );

		survey.setupTerrain( terrain );

		Materials.setTerrain( terrain );

		locationControls.hasLocation( survey, locationChecked );

		renderView();

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

			terrain.setScale( 0.0 );

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

	function onLocationAccuracyChange( event ) {

		terrain.setAccuracy( event.value );

	}

	function setCameraMode ( mode ) {

		cameraManager.setCamera( mode, controls.target );

		renderView();

	}

	function cameraMoved () {

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

	function setCameraLayer ( layerTag, enable ) {

		cameraManager.setCameraLayer( layerTag, enable );
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

	function setFog( enable ) {

		useFog = enable;

		fog.density = useFog ? 0.0025 : 0;

		renderView();

	}

	function setShadingMode ( mode ) {

		if ( survey.setShadingMode( mode ) ) shadingMode = mode;

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

		if ( survey.setLegShading( LEG_SURFACE, mode ) ) surfaceShadingMode = mode;

		renderView();

	}

	self.addOverlay = function ( name, overlayProvider, locationDefault ) {

		CommonTerrain.addOverlay( name, overlayProvider, container, locationDefault );

	};

	self.addFormatters = function ( stationFormatter ) {

		formatters.station = stationFormatter;

	};


	function cutSection () {

		if ( selectedSection === survey.surveyTree || selectedSection.p !== undefined ) return;

		cameraMove.cancel();

		survey.remove( terrain );
		survey.cutSection( selectedSection );

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

		if ( node.p === undefined ) {

			_selectSection( node );

		} else {

			_selectStation( node );

		}

		selectedSection = node;

		renderView();

		return;

		function _selectSection ( node ) {

			survey.selectSection( node );

			setShadingMode( shadingMode );

			if ( node === survey.surveyTree ) {

				cameraMove.prepare( survey.getWorldBoundingBox() );
				cameraMove.start( renderRequired );

				highlightSelection( node );

				return;

			} else {

				if ( node.boundingBox === undefined ) return;

				const boundingBox = node.boundingBox.clone();

				cameraMove.prepare( boundingBox.applyMatrix4( survey.matrixWorld ) );

			}

		}

		function _selectStation( node ) {

			if ( mouseMode === MOUSE_MODE_TRACE_EDIT ) {

				selectTraceStation( node );

			} else {

				survey.selectSection( node );

				setShadingMode( shadingMode );

				cameraMove.preparePoint( survey.getWorldPosition( node.p.clone() ) );

			}

		}

	}


	function getSelectedSectionName () {

		if ( selectedSection === survey.surveyTree ) {

			return '';

		} else {

			return selectedSection === undefined ? '' : selectedSection.getPath();

		}

	}

	function setSelectedSectionName ( name ) {

		const node = survey.surveyTree.getByPath( name );

		selectSection( node === undefined ? survey.surveyTree : node );

	}

	function resize () {

		// adjust the renderer to the new canvas size
		renderer.setSize( container.clientWidth, container.clientHeight );

		cameraManager.resize();

		self.dispatchEvent( { type: 'resized', name: '-' } );

		renderView();

	}

	this.clearView = function () {

		// clear the current cave model, and clear the screen
		caveIsLoaded = false;

		renderer.clear();

		hud.setVisibility( false );

		// terminate all running workers (tile loading/wall building etc)

		WorkerPool.terminateActive();

		scene.remove( survey );

		controls.enabled = false;

		survey          = null;
		terrain         = null;
		limits          = null;
		selectedSection = null;
		mouseMode       = MOUSE_MODE_NORMAL;
		mouseTargets    = [];
		hasLocation     = false;

		// remove event listeners

		container.removeEventListener( 'mousedown', mouseDown );

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

		resize();
		loadSurvey( new Survey( cave ) );

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

			self.setView( defaultView, Cfg.value( 'view', {} ) );

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

		var syncTerrainLoading = true;

		// only render after first SetupView()
		renderRequired = false;

		survey = newSurvey;

		hud.getProgressDial( 1 ).watch( survey );

		stats = self.getLegStats( LEG_CAVE );

		setScale();

		Materials.flushCache( survey );

		terrain = survey.terrain;

		scene.addStatic( survey );

		mouseTargets = survey.pointTargets;

		// set if we have independant terrain maps

		if ( terrain === null ) {

			if ( navigator.onLine ) {

				terrain = new WebTerrain( survey, _tilesLoaded, container );

				hud.getProgressDial( 0 ).watch( terrain );

				syncTerrainLoading = ! terrain.load();

				if ( syncTerrainLoading ) terrain = null;

			}

		} else {

			setupTerrain();

		}

		scene.matrixAutoUpdate = false;

		container.addEventListener( 'mousedown', mouseDown, false );

		controls.enabled = true;

		survey.getRoutes().addEventListener( 'changed', surveyChanged );
		survey.addEventListener( 'changed', surveyChanged );

		caveIsLoaded = true;

		selectedSection = survey.surveyTree;

		setupView( syncTerrainLoading );

		function _tilesLoaded ( errors ) {

			if ( terrain.parent === null ) {

				if ( errors > 0 ) {

					console.log( 'errors loading terrain' );

					terrain = null;

					setupView( true );

					return;

				}

				setupTerrain();

				setupView( true );

			}

			renderView();

		}

	}

	function surveyChanged ( /* event */ ) {

		setShadingMode( shadingMode );

	}

	function loadTerrain ( mode ) {

		if ( terrain !== null && terrain.isLoaded ) {

			terrain.setVisibility( mode );

			setCameraLayer( FEATURE_TERRAIN, mode );

			self.dispatchEvent( { type: 'change', name: 'terrain' } );

		}

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

	function mouseDown ( event ) {

		const scale = __v.set( container.clientWidth / 2, container.clientHeight / 2, 0 );
		const mouse = cameraManager.getMouse( event.clientX, event.clientY );

		raycaster.setFromCamera( mouse, cameraManager.activeCamera );

		const intersects = raycaster.intersectObjects( mouseTargets, false );

		var entrance;

		if ( mouseMode === MOUSE_MODE_NORMAL && self.entrances ) {

			entrance = survey.entrances.intersectLabels( mouse, cameraManager.activeCamera, scale );

			if ( entrance !== null ) {

				_selectStation( survey.surveyTree.findById( entrance.stationID ) );
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

		case MOUSE_MODE_ANNOTATE:

			selectAnnotation( visibleStation( intersects ) );
		*/
		}

		function _selectStation ( station ) {

			if ( station === null ) return;

			survey.selectStation( station );

			if ( event.button === MOUSE.LEFT ) {

				_showStationPopup( station );

			} else if ( event.button === MOUSE.RIGHT ) {

				_setStationPOI( station );

			}

		}

		function _setStationPOI( station ) {

			selectSection( station );

			cameraMove.start( true );
			event.stopPropagation();

			container.addEventListener( 'mouseup', _mouseUpLeft );

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

		function _mouseUpLeft () {

			if ( ! trackLocation ) controls.enabled = true;
			container.removeEventListener( 'mouseup', _mouseUpLeft );

		}

		function _showStationPopup ( station ) {

			const depth = ( terrain ) ? station.p.z - terrain.getHeight( station.p ) : null;

			if ( popup !== null ) return;

			popup = new StationPopup( container, station, survey, depth, formatters.station, ( shadingMode === SHADING_DISTANCE ), self.warnings );

			survey.add( popup );

			container.addEventListener( 'mouseup', _mouseUpRight );

			renderView();

			cameraMove.preparePoint( survey.getWorldPosition( station.p.clone() ) );

			return true;

		}

		function _selectSegment ( picked ) {

			const routes = survey.getRoutes();

			routes.toggleSegment( picked.index );

			setShadingMode( SHADING_PATH );

			renderView();

			return true;

		}

		function _mouseUpRight ( /* event */ ) {

			container.removeEventListener( 'mouseup', _mouseUpRight );

			popup.close();
			popup = null;

			survey.clearSelection();

			renderView();

		}

	}
	/*
	function selectAnnotation ( station ) {

		const annotations = survey.annotations;

		if ( station === null ) return;

		survey.selectStation( station );

		self.dispatchEvent( {
			type: 'selectedAnnotation',
			annotationInfo: annotations.getStation( station ),
			add: function _setAnnotation( annotation ) {

				console.log( 'annotation handler: ', annotation );
				annotations.setStation( station, annotation );
				renderView();

			}
		} );

		renderView();

	}

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

			if ( useFog ) Materials.setFog( true );

			cameraManager.activeRenderer();

		}

		if ( useFog ) Materials.setFog( false );

		hud.renderHUD();

	}

	this.renderView = renderView;

	function onCameraMoveEnd () {

		self.dispatchEvent( { type: 'moved' } );

		if ( terrain && terrain.isTiled && self.terrain ) {

			// schedule a timeout to load replace discarded tiles or higher res tiles

			if ( timerId !== null ) {

				clearTimeout( timerId );

			}

			retileScaler = 4;
			lastActivityTime = performance.now();
			timerId = setTimeout( updateTerrain, RETILE_TIMEOUT );

		}

	}

	function updateTerrain () {

		if ( performance.now() - lastActivityTime > RETILE_TIMEOUT ) {

			if ( terrain && terrain.zoomCheck( cameraManager ) ) {

				timerId = setTimeout( updateTerrain, RETILE_TIMEOUT * retileScaler );
				retileScaler *= 2;

			}

		}

		timerId = null;

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

	this.getSurveyTree = function () {

		return survey.surveyTree;

	};
}

CaveViewer.prototype = Object.create( EventDispatcher.prototype );

// export public interface
/*
Object.assign( Viewer, {
		// addAnnotator:  Annotations.addAnnotator,
	} );
*/
export { CaveViewer };


// EOF