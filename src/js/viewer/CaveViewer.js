import {
	VERSION,
	LM_NONE, LM_SINGLE,
	FACE_WALLS, FACE_SCRAPS, FEATURE_TRACES, FEATURE_GRID, SURVEY_WARNINGS,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE, LEG_DUPLICATE,
	LABEL_STATION, LABEL_STATION_COMMENT,
	SHADING_PATH, SHADING_DISTANCE,
	FEATURE_BOX, FEATURE_ENTRANCES, FEATURE_TERRAIN, FEATURE_STATIONS, FEATURE_ENTRANCE_DOTS,
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
import { StationDistancePopup } from './StationDistancePopup';
import { SegmentPopup } from './SegmentPopup';
import { StationNameLabel } from './StationNameLabel';
import { PublicFactory } from '../public/PublicFactory';
import { ImagePopup } from './ImagePopup';
import { WebTerrain } from '../terrain/WebTerrain';
import { CommonTerrain } from '../terrain/CommonTerrain';
import { Cfg } from '../core/Cfg';
import { WorkerPoolCache } from '../core/WorkerPool';
import { ViewState } from './ViewState';
import { OrbitControls } from '../ui/OrbitControls';
import { ExportGltf } from './ExportGltf';
import { Snapshot } from './Snapshot';

import {
	EventDispatcher, Vector3, Scene, Raycaster, WebGLRenderer, MOUSE, FogExp2
} from '../Three';

class CaveViewer extends EventDispatcher {

	constructor ( domID, configuration ) {

		super();
		console.log( 'CaveView v' + VERSION );

		const container = document.getElementById( domID );

		if ( ! container ) throw new Error( 'No container DOM object [' + domID + '] available' );

		this.container = container;

		// target with css for fullscreen on small screen devices
		container.classList.add( 'cv-container' );

		const cfg = new Cfg( configuration );

		const ctx = {
			cfg: cfg,
			container: container,
			workerPools: new WorkerPoolCache ( cfg ),
			glyphStringCache: new Map(),
			materials: null,
			viewer: this
		};

		this.ctx = ctx;

		const materials = new Materials( this );

		ctx.materials = materials;

		container.style.backgroundColor = cfg.themeColorCSS( 'background' );

		let renderer = new WebGLRenderer( { antialias: true, alpha: true } );

		resetRenderer();

		updatePixelRatio();

		renderer.clear();
		renderer.autoClear = false;

		container.appendChild( renderer.domElement );

		const fog = new FogExp2( cfg.themeColorCSS( 'background' ), 0.0025 );

		const scene = new Scene();
		scene.fog = fog;
		scene.name = 'CV.Viewer';

		const cameraManager = new CameraManager( ctx, renderer, scene );

		const raycaster = new Raycaster();

		raycaster.layers.enableAll();

		// setup lighting
		const lightingManager = new LightingManager( ctx, scene );

		// setup controllers
		const controls = new OrbitControls( cameraManager, renderer.domElement, this );
		controls.maxPolarAngle = cfg.themeAngle( 'maxPolarAngle' );
		controls.addEventListener( 'change', onCameraMoved );
		controls.addEventListener( 'end', onCameraMoveEnd );

		const cameraMove = new CameraMove( controls, onCameraMoved );
		const moveEndEvent = { type: 'moved', cameraManager: cameraManager };

		const formatters = {};

		let caveIsLoaded = false;
		let publicFactory = null;

		const mouseUpEvent = { type: 'select', node: null };

		let lastMouseMode = MOUSE_MODE_NORMAL;
		let mouseMode = MOUSE_MODE_NORMAL;
		let mouseTargets = [];
		let filterConnected = false;
		let clickCount = 0;

		let terrain = null;
		let survey = null;

		let useFog = false;

		let renderRequired = true;

		let popup = null;

		let clipped = false;

		// preallocated tmp objects

		const __v = new Vector3();
		const self = this;

		let mouseUpFunction = null;
		let savedView = null;
		let mouseOver = false;

		let hoverLabel = null;
		let showStationNameLabel = false;
		let showStationDistances = false;
		let startStation = null;
		let lastPointerOver = 0;

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

			'stationLabelOver': {
				get: function () { return showStationNameLabel; },
				set: setStationNameLabelMode
			},

			'terrainShading': {
				get: function () { return terrain !== null ? terrain.shadingMode : null; },
				set: stateSetter( setTerrainShadingMode, 'terrainShading')
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
				get: function () { return ( lightingManager.lightingMode !== LM_NONE ); },
				set: function ( x ) { setTerrainLighting( x ? LM_SINGLE : LM_NONE ); }
			},

			'terrainLightingMode': {
				get: function () { return lightingManager.lightingMode; },
				set: setTerrainLighting
			},

			'terrainThrough': {
				get: function () { return terrain !== null ? terrain.throughMode : null; },
				set: stateSetter( setTerrainThroughMode, 'terrainThrough' )
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
				set: stateSetter( setShadingMode, 'shadingMode' )
			},

			'hideMode': {
				get: function () { return survey.hideMode; },
				set: function ( x ) { survey.setHideMode( x ); renderView(); }
			},

			'flatShading': {
				get: function () { return survey.wallsMode; },
				set: function ( x ) { survey.setWallsMode( x ); renderView(); }
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
				set: stateSetter( setSurfaceShadingMode, 'surfaceShading' )
			},

			'duplicateShading': {
				get: function () { return survey.duplicateShading; },
				set: stateSetter( setDuplicateShadingMode, 'duplicateShading' )
			},

			'cameraType': {
				get: function () { return cameraManager.mode; },
				set: stateSetter( setCameraMode, 'cameraType' )
			},

			'eyeSeparation': {
				get: function () { return cameraManager.eyeSeparation; },
				set: setEyeSeparation
			},

			'view': {
				get: function () { return VIEW_NONE; },
				set: stateSetter( setViewMode, 'view' )
			},

			'cursorHeight': {
				get: function () { return materials.cursorHeight; },
				set: setCursorHeight
			},

			'linewidth': {
				get: function () { return ( materials.linewidth - 1 ) / 10; },
				set: stateSetter( setLinewidth, 'linewidth' )
			},

			'scaleLinewidth': {
				get: function () { return materials.scaleLinewidth; },
				set: stateSetter( setScaleLinewidth, 'scaleLinewidth' )
			},

			'maxDistance': {
				get: function () { return survey.getMaxDistance(); }
			},

			'maxHeight': {
				get: function () { return ( survey === null ) ? 0 : survey.limits.max.z; }
			},

			'minHeight': {
				get: function () { return ( survey === null ) ? 0 : survey.limits.min.z; }
			},

			'section': {
				get: function () { return survey.selection.getNode(); },
				set: stateSetter( selectSection, 'section' )
			},

			'sectionByName': {
				get: getSelectedSectionName,
				set: setSelectedSectionName
			},

			'popup': {
				set: setPopup
			},

			'highlight': {
				set: stateSetter( highlightSelection, 'highlight' )
			},

			'polarAngle': {
				get: function () { return controls.getPolarAngle(); },
				set: function ( x ) { cameraMove.setPolarAngle( x ); }
			},

			'azimuthAngle': {
				set: function ( x ) { cameraMove.setAzimuthAngle( x ); }
			},

			'editMode': {
				get: function () { return mouseMode; },
				set: stateSetter( setEditMode, 'editMode' )
			},

			'setPOI': {
				//get: function () { return true; },
				set: stateSetter( setCameraPOI, 'setPOI' )
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

			'fog': {
				get: function () { return useFog; },
				set: setFog
			},

			'isClipped': {
				get: function () { return clipped; }
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

		enableLayer( FEATURE_BOX,       'box' );
		enableLayer( FEATURE_ENTRANCES, 'entrances' );
		enableLayer( FEATURE_ENTRANCE_DOTS, 'entrance_dots' );
		enableLayer( FEATURE_STATIONS,  'stations' );
		enableLayer( FEATURE_TRACES,    'traces' );
		enableLayer( FEATURE_GRID,      'grid' );
		enableLayer( FACE_SCRAPS,       'scraps' );
		enableLayer( FACE_WALLS,        'walls' );
		enableLayer( LEG_CAVE,          'legs' );
		enableLayer( LEG_SPLAY,         'splays' );
		enableLayer( LEG_SURFACE,       'surfaceLegs' );
		enableLayer( LEG_DUPLICATE,     'duplicateLegs' );
		enableLayer( LABEL_STATION,     'stationLabels' );
		enableLayer( LABEL_STATION_COMMENT, 'stationComments' );
		enableLayer( SURVEY_WARNINGS,     'warnings' );

		container.addEventListener( 'mouseover', onMouseOver );
		container.addEventListener( 'mouseleave', onMouseLeave );

		container.addEventListener( 'fullscreenchange', onFullscreenChange );
		container.addEventListener( 'webkitfullscreenchange', onFullscreenChange );

		this.addEventListener( 'change', viewChanged );

		cfg.addEventListener( 'colors', () => {

			container.style.backgroundColor = cfg.themeColorCSS( 'background' );
			renderer.setClearColor( cfg.themeColor( 'background' ), 0.0 );

			if ( survey ) survey.refreshColors();

			renderView();

		} );

		function onMouseOver () {

			mouseOver = true;

		}

		function onMouseLeave () {

			mouseOver = false;

		}

		function setStationNameLabelMode ( mode ) {

			if ( mode ) {

				container.addEventListener( 'pointermove', onPointerMove );


			} else {

				if ( hoverLabel !== null ) {

					hoverLabel.close();
					hoverLabel = null;
					renderView();

				}

				container.removeEventListener( 'pointermove', onPointerMove );

			}

			showStationNameLabel = mode;

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

		const viewState = new ViewState( this );

		this.renderView = renderView;

		onResize();

		function enableLayer ( layerTag, name ) {

			Object.defineProperty( self, name, {
				get: function () { return cameraManager.testCameraLayer( layerTag ); },
				set: function ( x ) {

					if ( cameraManager.setCameraLayer( layerTag, x ) ) {

						self.dispatchEvent( { type: 'change', name: name } );

					}

					renderView();
				}
			} );

			const hasName = 'has' + name.substr( 0, 1 ).toUpperCase() + name.substr( 1 );

			Object.defineProperty( self, hasName, {
				get: function () { return survey.hasFeature( layerTag ); }
			} );

		}

		function stateSetter ( modeFunction, name ) {

			return function ( newMode ) {

				modeFunction( isNaN( newMode ) ? newMode : Number( newMode ) );
				self.dispatchEvent( { type: 'change', name: name } );

			};

		}

		function resetRenderer () {

			renderer.setSize( container.clientWidth, container.clientHeight );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setClearColor( cfg.themeColor( 'background' ), 0.0 );
			renderer.setClearAlpha( 0.0 );
			renderer.setRenderTarget( null );

		}

		function updatePixelRatio() {

			const pr = window.devicePixelRatio;
			renderer.setPixelRatio( pr );

			matchMedia( `(resolution: ${pr}dppx)` ).addEventListener( 'change', updatePixelRatio, { once: true } );

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

			if ( document.fullscreenElement || document.webkitFullscreenElement ) {

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

				} else if ( document.webkitFullscreenElement === null) {

					container.webkitRequestFullscreen();

				}

			} else {

				container.classList.remove( 'toggle-fullscreen' );

				if ( document.fullscreenElement ) {

					document.exitFullscreen();

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

		function setLinewidth ( x ) {

			materials.linewidth = x * 10 + 1;
			renderView();

		}

		function setScaleLinewidth ( x ) {

			materials.scaleLinewidth = !! x;
			renderView();

		}

		function setTerrainShadingMode ( mode ) {

			if ( terrain === null ) return;

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

		function setTerrainLighting ( mode ) {

			lightingManager.lightingMode = mode;

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

				if ( terrain.isTiled ) {

					terrain.addEventListener( 'progress', onEnd );
					terrain.watch( self );

				}

			}

			setScale();
			setupView( true );

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

			lightingManager.setRotation( cameraManager.getRotation() );

			renderView( true );

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

			const shadingMode = survey.setShadingMode( mode, filterConnected );

			if ( shadingMode === SHADING_DISTANCE ) {

				if ( mouseMode !== MOUSE_MODE_DISTANCE ) {

					lastMouseMode = mouseMode;
					mouseMode = MOUSE_MODE_DISTANCE;
					mouseTargets = survey.pointTargets;

				}

			} else {

				mouseMode = lastMouseMode;

			}

			renderView();

		}

		function setSurfaceShadingMode ( mode ) {

			survey.setSurfaceShading( mode );

			renderView();

		}

		function setDuplicateShadingMode ( mode ) {

			survey.setDuplicateShading( mode );

			renderView();

		}

		this.addOverlay = function ( name, overlayProvider ) {

			CommonTerrain.addOverlay( ctx, name, overlayProvider );

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

				if ( mouseMode === MOUSE_MODE_TRACE_EDIT ) {

					selectTraceStation( node );

				} else {

					survey.selectStation( node );

					cameraMove.preparePoint( survey.getWorldPosition( node.clone() ) );

				}

			} else {

				survey.selectSection( node );

				cameraMove.cancel();
				cameraMove.prepare( survey.selection.getWorldBoundingBox() );

				if ( survey.selection.isEmpty() ) cameraMove.start( renderRequired );

			}

			renderView();

		}

		function getSelectedSectionName () {

			return survey.selection.getName();

		}

		function setSelectedSectionName ( name ) {

			selectSection( survey.selection.getByNme( name ) );

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
			mouseMode       = MOUSE_MODE_NORMAL;
			mouseTargets    = [];

			// remove event listeners

			container.removeEventListener( 'mousedown', onMouseDown );

			cameraManager.resetCameras();

			controls.reset();

			this.dispatchEvent( { type: 'clear' } );

		};

		this.loadCave = function ( file, section ) {

			caveLoader.loadFile( file, section );

			clipped = ( section !== undefined && section !== '' );

		};

		this.loadCaves = function ( files ) {

			caveLoader.loadFiles( files );

		};

		function caveLoaded ( cave ) {

			if ( ! cave ) {

				alert( 'failed loading cave information' );
				return;

			}

			onResize();

			try {

				loadSurvey( new Survey( ctx, cave ) );

			} catch ( e ) {

				alert( e );

			}

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

				self.setView( ViewState.default, cfg.value( 'view', {} ) );

			} else {

				self.setView( savedView );
				savedView = null;

			}

			if ( final ) {

				// signal any listeners that we have a new cave

				self.dispatchEvent( { type: 'newCave', name: 'newCave' } );

				// set reasonable min/max zoom & distances for the cameras
				controls.setLimits( survey.combinedLimits.getSize( __v ) );

			}

		}

		function loadSurvey ( newSurvey ) {

			// only render after first SetupView()
			renderRequired = false;

			survey = newSurvey;

			hud.getProgressDial( 1 ).watch( survey );

			setScale();

			materials.flushCache();
			publicFactory = new PublicFactory( survey );

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
			survey.addStatic( popup );

			renderView();

		}

		function showStationPopup ( pStation ) {

			if ( popup !== null ) return;

			popup = new StationPopup( ctx, pStation, survey, formatters.station, ( survey.caveShading === SHADING_DISTANCE ), self.warnings );
			survey.addStatic( popup );

			renderView();

		}

		function showSegmentPopup ( leg, point ) {

			if ( popup !== null ) return;

			popup = new SegmentPopup( ctx, leg, point );
			scene.addStatic( popup );

			renderView();

		}

		function setPopup ( station ) {

			closePopup();

			if ( station.isStation() ) showStationPopup( publicFactory.getStation( station ) );

		}

		function closePopup () {

			if ( popup === null ) return;

			popup.close();
			popup = null;

		}

		function endDistanceMode ( event ) {

			if ( event.key != 'Shift' ) return;

			// cancel showStation mode

			showStationDistances = false;

			closePopup();
			setStationNameLabelMode( false );
			controls.enabled = true;

			document.removeEventListener( 'keyup', endDistanceMode );

		}

		function showStationPopupX ( station, event ) {

			if ( event.shiftKey && ! showStationDistances ) {

				showStationDistances = true;
				startStation = station.station;

				setStationNameLabelMode( true );
				controls.enabled = false;

				document.addEventListener( 'keyup', endDistanceMode );

			} else {

				showStationPopup( station );

			}

			mouseUpFunction = closePopup;

			cameraMove.preparePoint( survey.getWorldPosition( station.station.clone() ) );

		}

		function mouseUp () {

			container.removeEventListener( 'mouseup', mouseUp );

			if ( mouseUpFunction ) mouseUpFunction();

			renderView();

			self.dispatchEvent( mouseUpEvent );

		}

		function filterConnectedLegs ( event ) {

			if ( event.filterConnected ) {

				filterConnected = true;

				setShadingMode( survey.caveShading );
				renderView();

				filterConnected = false;

			}

		}

		this.getStationUnderMouse = function ( mouse, station ) {

			const threshold = raycaster.params.Points.threshold;

			raycaster.setFromCamera( mouse, cameraManager.activeCamera );
			raycaster.params.Points.threshold = 20;

			const hit = raycaster.intersectObject( survey.stations, false )[ 0 ];

			raycaster.params.Points.threshold = threshold;

			return ( hit !== undefined ) ? survey.getWorldPosition( station.copy( hit.station ) ) : null;

		};

		function checkLegIntersects ( event ) {

			const legs = survey.features.get( LEG_CAVE );
			const legIntersect = raycaster.intersectObject( legs, false )[ 0 ];

			let legIndex = null;
			let segment = null;

			if  ( legIntersect ) {

				legIndex = legIntersect.faceIndex;

				const legInfo = legs.getLegInfo( legIndex );
				const leg = publicFactory.getLeg( legInfo );

				segment = legInfo.segment;

				const e = {
					type: 'leg',
					leg: leg,
					handled: false,
					highlight: false,
					mouseEvent: event
				};

				self.dispatchEvent( e );

				if ( e.highlight ) {

					mouseUpFunction = _setLegHighlight;

					_setLegHighlight();
					renderView();

				}

				if ( ! e.handled ) {

					mouseUpFunction = _setSegmentHighlight;

					_setSegmentHighlight();
					showSegmentPopup( leg, legIntersect.pointOnLine );
					renderView();

				}

				legIndex = null;
				segment = null;

			}

			function _setLegHighlight () {

				legs.setHighlightLeg( legIndex );
				setShadingMode( survey.caveShading );

			}

			function _setSegmentHighlight () {

				legs.setHighlightSegment( segment );
				setShadingMode( survey.caveShading );
				if ( segment === null ) closePopup();

			}

		}

		function selectStation ( station, event ) {

			survey.selectStation( station );

			const pStation = publicFactory.getStation( station );

			const selectEvent = {
				type: 'station',
				node: pStation,
				handled: false,
				mouseEvent: event,
				filterConnected: false
			};

			self.dispatchEvent( selectEvent );

			filterConnectedLegs( selectEvent );

			if ( selectEvent.handled ) return;

			if ( event.button === MOUSE.LEFT ) {

				showStationPopupX( pStation, event );

			} else if ( event.button === MOUSE.RIGHT ) {

				if ( ! survey.selection.contains( station.id ) ) {

					survey.selectSection( survey.surveyTree );

				}

				selectSection( station );

				cameraMove.start( true );
				event.stopPropagation();

				mouseUpFunction = null;

			}

		}

		function onPointerMove( event ) {

			if ( event.target !== renderer.domElement ) return;

			const mouse = cameraManager.getMouse( event.clientX, event.clientY );

			raycaster.setFromCamera( mouse, cameraManager.activeCamera );
			const hit = raycaster.intersectObjects( mouseTargets, false )[ 0 ];

			if ( hit === undefined ) {

				setTimeout( () => {

					if ( hoverLabel !== null && performance.now() - lastPointerOver > 250 ) {

						hoverLabel.close();
						hoverLabel = null;

						renderView();

					}

					return;

				}, 500 );

				return;

			}

			const station = hit.station;

			if ( hoverLabel !== null && hoverLabel.station !== station ) {

				hoverLabel.close();
				hoverLabel = null;

			}

			if ( hoverLabel === null ) {

				if ( showStationDistances ) {

					hoverLabel = new StationDistancePopup( ctx, survey, startStation, station );

				} else {

					hoverLabel = new StationNameLabel( ctx, station );

				}

				survey.addStatic( hoverLabel );

			}

			lastPointerOver = performance.now();

			renderView();

		}

		function onMouseDown ( event ) {

			if ( event.target !== renderer.domElement ) return;

			const mouse = cameraManager.getMouse( event.clientX, event.clientY );

			raycaster.setFromCamera( mouse, cameraManager.activeCamera );

			container.addEventListener( 'mouseup', mouseUp );

			if ( event.altKey ) {

				checkLegIntersects( event );
				return;

			}

			if ( self.entrances ) {

				const entrance = raycaster.intersectObjects( survey.entrances.labels, false )[ 0 ];

				if ( entrance !== undefined ) {

					const station = survey.surveyTree.findById( entrance.object.stationID );

					const e = {
						type: 'entrance',
						displayName: entrance.name,
						station: publicFactory.getStation( station ),
						filterConnected: false,
						handled: false,
						mouseEvent: event
					};

					self.dispatchEvent( e );

					filterConnectedLegs( e );

					if ( ! e.handled ) {

						selectStation( station, event );

					}

					return;

				}

			}

			const hit = raycaster.intersectObjects( mouseTargets, false )[ 0 ];

			switch ( mouseMode ) {

			case MOUSE_MODE_NORMAL:

				if ( hit === undefined ) break;
				selectStation( hit.station, event );

				break;

			case MOUSE_MODE_ROUTE_EDIT:

				if ( hit === undefined ) break;
				selectSegment( hit );

				break;

			case MOUSE_MODE_DISTANCE:

				selectDistance( hit, event );

				break;

			case MOUSE_MODE_TRACE_EDIT:

				if ( event.button === MOUSE.LEFT && hit ) {

					if ( hit.station ) {

						selectTraceStation( hit.station );

					} else {

						selectTrace( hit );

					}

				}

				break;

			}

		}

		function selectDistance ( hit, event ) {

			if ( ! hit ) {

				if ( event.button === MOUSE.RIGHT ) {

					// default distance shading
					survey.maxDistance = 0;
					setShadingMode( SHADING_DISTANCE );

				}

				return;

			}

			const station = hit.station;

			if ( event.button === MOUSE.LEFT ) {

				survey.showShortestPath( station );

				showStationPopupX( publicFactory.getStation( station ), event );

			} else if ( event.button === MOUSE.RIGHT ) {

				survey.setShortestPaths( station );

				self.dispatchEvent( { type: 'change', name: 'shadingMode' } );
				renderView();

			}

		}

		function selectSegment ( picked ) {

			survey.getRoutes().toggleSegment( picked.index );

			setShadingMode( SHADING_PATH );

			renderView();

		}

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

			const dyeTraces = survey.dyeTraces;
			const markers = survey.markers;

			dyeTraces.outlineTrace( null );

			if ( ++clickCount === 3 ) {

				markers.clear();
				clickCount = 1;

			}

			markers.mark( station );

			const list = markers.getStations();

			let start, end;

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

		function renderView ( autorotate = false ) {

			if ( ! renderRequired ) return;

			// ignore render requests if we are autorotating so don't need
			// extra render calls

			if ( controls.autoRotate && ! autorotate ) return;

			renderer.clear();

			if ( caveIsLoaded ) {

				survey.update( cameraManager, controls.target );

				if ( useFog ) materials.setFog( true );

				cameraManager.activeRenderer();

			}

			if ( useFog ) materials.setFog( false );

			hud.renderHUD();

		}

		this.resetRenderer = resetRenderer;
		this.renderView = renderView;
		this.resize = onResize;

		function onCameraMoveEnd () {

			self.dispatchEvent( moveEndEvent );

		}

		function setCameraPOI () {

			cameraMove.start( true );

		}

		function setScale () {

			const range = survey.combinedLimits.getSize( __v );

			let hScale = Math.min( container.clientWidth / range.x, container.clientHeight / range.y );

			if ( hScale === Infinity ) hScale = 1;

			// scaling to compensate distortion introduced by projection ( x and y coords only ) - approx only
			const vScale = hScale * survey.scaleFactor;

			survey.setScale( hScale, vScale );

			hud.setScale( vScale );

		}

		this.getLegStats = function ( type ) {

			const legs = survey.getFeature( type );

			return ( legs !== undefined ) ? legs.stats : {
				legs: 0,
				legLength: 0,
				minLegLength: 0,
				maxLegLength: 0
			};

		};

		this.getMetadata = function () {

			return survey.metadata;

		};

		this.getGLTFExport = function ( selection, options, callback ) {

			new ExportGltf( ctx, survey, selection, options, callback );

		};

		this.getSurveyTree = function () {

			return survey.surveyTree;

		};

		this.getStation = function ( path ) {

			const node = survey.surveyTree.getByPath( path );

			if ( node && node.isStation() && node.connections > 0 ) {

				return publicFactory.getStation( node );

			} else {

				return null;

			}

		};

		this.showImagePopup = function ( event, imageUrl ) {

			showStationImagePopup( event.node, imageUrl );
			mouseUpFunction = closePopup;

		};

		this.getSnapshot = function ( exportSize, lineScale ) {

			return new Snapshot( ctx, renderer ).getSnapshot( exportSize, lineScale );

		};

		this.forEachStation = function ( callback ) {

			survey.stations.forEach( station => callback( publicFactory.getStation( station ) ) );

		};

		this.forEachLeg = function ( callback ) {

			const legs = survey.getFeature( LEG_CAVE );
			legs.forEachLeg( legId => callback( publicFactory.getLeg( legId ) ) );

		};

		this.dispose = function () {

			ctx.workerPools.dispose();
			scene.remove( survey );
			controls.dispose();
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
			container.removeEventListener( 'webkitfullscreenchange', onFullscreenChange );

			renderer.clear();
			renderer.dispose();

			renderer = null;

		};

	}

}

export { CaveViewer };