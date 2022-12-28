import { EventDispatcher, FogExp2, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from '../Three';
import {
	FACE_SCRAPS, FACE_WALLS, FACE_MODEL, FEATURE_BOX, FEATURE_ENTRANCES, FEATURE_ENTRANCE_DOTS, FEATURE_GRID, FEATURE_STATIONS, FEATURE_TERRAIN, FEATURE_TRACES,
	LABEL_STATION, LABEL_STATION_COMMENT, LEG_CAVE, LEG_SPLAY, LEG_DUPLICATE, LEG_SURFACE, LM_NONE, LM_SINGLE, MOUSE_MODE_TRACE_EDIT, SURVEY_WARNINGS,
	VERSION, VIEW_ELEVATION_E, VIEW_ELEVATION_N, VIEW_ELEVATION_S, VIEW_ELEVATION_W,  VIEW_NONE, VIEW_PLAN,
} from '../core/constants';

import { CameraManager } from './CameraManager';
import { CameraMove } from './CameraMove';
import { CaveLoader } from '../loaders/CaveLoader';
import { Cfg } from '../core/Cfg';
import { CommonTerrain } from '../terrain/CommonTerrain';
import { ExportGltf } from './ExportGltf';
import { HUD } from '../hud/HUD';
import { LightingManager } from './LightingManager';
import { Materials } from '../materials/Materials';
import { ModelSource } from '../core/ModelSource';
import { OrbitControls } from '../ui/OrbitControls';
import { PointerControls } from '../ui/PointerControls';
import { PublicFactory } from '../public/PublicFactory';
import { RenderUtils } from '../core/RenderUtils';
import { Snapshot } from './Snapshot';
import { Survey } from './Survey';
import { ViewState } from './ViewState';
import { WebTerrain } from '../terrain/WebTerrain';
import { WorkerPoolCache } from '../core/WorkerPool';

class CaveViewer extends EventDispatcher {

	constructor ( domID, configuration ) {

		super();
		console.log( 'CaveView v' + VERSION );

		const container = document.getElementById( domID );

		if ( ! container ) throw new Error( 'No container DOM object [' + domID + '] available' );

		this.container = container;

		const cfg = new Cfg( configuration );

		// target with css for fullscreen on small screen devices
		container.classList.add( 'cv-container' );
		container.style.backgroundColor = cfg.themeColorCSS( 'background' );


		const ctx = {
			cfg: cfg,
			container: container,
			workerPools: new WorkerPoolCache ( cfg ),
			glyphStringCache: new Map(),
			materials: null,
			viewer: this,
			renderUtils: new RenderUtils()
		};

		this.ctx = ctx;

		const materials = new Materials( this );

		ctx.materials = materials;

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

		// setup lighting
		const lightingManager = new LightingManager( ctx, scene );

		// setup controllers
		const controls = new OrbitControls( cameraManager, renderer.domElement, this );

		this.getControls = function () { return controls; };

		controls.maxPolarAngle = cfg.themeAngle( 'maxPolarAngle' );
		controls.addEventListener( 'change', onCameraMoved );
		controls.addEventListener( 'end', onCameraMoveEnd );

		const cameraMove = new CameraMove( controls, onCameraMoved );
		this.cameraMove = cameraMove;

		const moveEndEvent = { type: 'moved', cameraManager: cameraManager };
		const pointerControls = new PointerControls( ctx, renderer.domElement );

		let publicFactory = null;

		const mouse = new Vector2();
		const raycaster = new Raycaster();

		raycaster.layers.enableAll();
		raycaster.params.Points.threshold = 20;

		let terrain = null;
		let survey = null;

		let useFog = false;

		let renderRequired = true;
		let clipped = false;

		// preallocated tmp objects

		const __v = new Vector3();
		const self = this;

		let savedView = null;
		let mouseOver = false;

		// event handler
		window.addEventListener( 'resize', onResize );

		Object.defineProperties( this, {

			'mouseOver': {
				get() { return mouseOver; }
			},

			'reset': {
				set() { setupView( false ); }
			},

			'surveyLoaded': {
				get() { return ( survey !== null ); }
			},

			'terrain': {
				get() { return cameraManager.testCameraLayer( FEATURE_TERRAIN ); },
				set: loadTerrain,
				enumerable: true
			},

			'stationLabelOver': {
				get() { return pointerControls.getStationNameLabelMode(); },
				set: x => { pointerControls.setStationNameLabelMode( x ); },
				enumerable: true
			},

			'terrainShading': {
				get() { return terrain !== null ? terrain.shadingMode : null; },
				set: stateSetter( setTerrainShadingMode, 'terrainShading'),
				enumerable: true
			},

			'hasTerrain': {
				get() { return !! terrain; }
			},

			'hasRealTerrain': {
				get() { return ( terrain && ! terrain.isFlat ); }
			},

			'terrainAttributions': {
				get() { return terrain !== null ? terrain.attributions : []; }
			},

			'terrainDirectionalLighting': {
				get() { return ( lightingManager.lightingMode !== LM_NONE ); },
				set: x => { lightingManager.lightingMode = x ? LM_SINGLE : LM_NONE; }
			},

			'terrainLightingMode': {
				get() { return lightingManager.lightingMode; },
				set: stateSetter( mode => { lightingManager.lightingMode = mode; }, 'terrainLightingMode' ),
				enumerable: true
			},

			'terrainShadingModes': {
				get() { return terrain !== null ? terrain.terrainShadingModes : {}; }
			},

			'terrainTileSet': {
				get() { return terrain?.tileSet.bind( terrain ); }
			},

			'terrainDatumShift': {
				get() { return !! terrain?.activeDatumShift; },
				set: stateSetter( x => { terrain?.applyDatumShift( x ); }, 'terrainDatumShift' ),
				enumerable: true
			},

			'terrainDatumShiftValue': {
				get() { return Math.round( terrain.datumShift ); },
				set: stateSetter( x => { terrain.datumShift = x; }, 'terrainDatumShiftValue' )
			},

			'terrainOpacity': {
				get() { return ( terrain !== null ) ? terrain.getOpacity() : 0; },
				set: stateSetter( x => { terrain?.setOpacity( x ); }, 'terrainOpacity' ),
				enumerable: true
			},

			'shadingMode': {
				get() { return survey?.caveShading; },
				set: stateSetter( mode => survey.setShadingMode( mode, false ), 'shadingMode' ),
				enumerable: true
			},

			'hideMode': {
				get() { return survey?.hideMode; },
				set: x => { survey.setHideMode( x ); renderView(); }
			},

			'flatShading': {
				get() { return survey?.wallsMode; },
				set: x => { survey.setWallsMode( x ); renderView(); },
				enumerable: true
			},

			'route': {
				get() { return survey?.getRoutes().setRoute; },
				set: x => { survey.getRoutes().setRoute = x; }
			},

			'routeNames': {
				get() { return survey?.getRoutes().getRouteNames(); },
			},

			'surfaceShading': {
				get() { return survey?.surfaceShading; },
				set: stateSetter( mode => survey.setSurfaceShading( mode ), 'surfaceShading' ),
				enumerable: true
			},

			'duplicateShading': {
				get() { return survey?.duplicateShading; },
				set: stateSetter( mode => survey.setDuplicateShading( mode ), 'duplicateShading' ),
				enumerable: true
			},

			'cameraType': {
				get() { return cameraManager.mode; },
				set: stateSetter( mode => cameraManager.setCamera( mode, controls.target ), 'cameraType' ),
				enumerable: true
			},

			'eyeSeparation': {
				get() { return cameraManager.eyeSeparation; },
				set: stateSetter( x => { cameraManager.eyeSeparation = x; }, 'eyeSeparation' )
			},

			'view': {
				get() { return VIEW_PLAN; },
				set: stateSetter( setViewMode, 'view' ),
				enumerable: true
			},

			'cursorHeight': {
				get() { return materials.cursorHeight; },
				set: stateSetter( x => { materials.cursorHeight = x; }, 'cursorHeight' )
			},

			'linewidth': {
				get() { return ( materials.linewidth - 1 ) / 10; },
				set: stateSetter( x => { materials.linewidth = x * 10 + 1; }, 'linewidth' ),
				enumerable: true
			},

			'scaleLinewidth': {
				get() { return materials.scaleLinewidth; },
				set: stateSetter( x => { materials.scaleLinewidth = !! x; }, 'scaleLinewidth' )
			},

			'maxDistance': {
				get() { return ( survey === null ) ? 0 :  survey.getMaxDistance(); }
			},

			'maxHeight': {
				get() { return ( survey === null ) ? 0 : survey.limits.max.z; }
			},

			'minHeight': {
				get() { return ( survey === null ) ? 0 : survey.limits.min.z; }
			},

			'section': {
				get() { return ( survey === null ) ? null : survey.selection.getNode(); },
				set: stateSetter( selectSection, 'section' )
			},

			'sectionByName': {
				get: () => survey?.selection.getName(),
				set: name => { selectSection( survey.selection.getByName( name ) ); }
			},

			'popup': {
				set: x => { pointerControls.setPopup( x ); }
			},

			'highlight': {
				set: stateSetter( node => survey.highlightSelection( node ), 'highlight' )
			},

			'polarAngle': {
				get() { return controls.getPolarAngle(); },
				set: x => { cameraMove.setPolarAngle( x ); }
			},

			'azimuthAngle': {
				set: x => { cameraMove.setAzimuthAngle( x ); }
			},

			'editMode': {
				get() { return pointerControls.getEditMode(); },
				set: stateSetter( x => { pointerControls.setEditMode( x ); }, 'editMode' )
			},

			'setPOI': {
				set: stateSetter( () => cameraMove.start( true ), 'setPOI' )
			},

			'HUD': {
				get() { return hud.getVisibility(); },
				set: x => { hud.setVisibility( x ); },
				enumerable: true
			},

			'cut': {
				set: cutSection
			},

			'zScale': {
				get() { return survey?.zScale; },
				set: stateSetter( x => { survey.zScale = x; }, 'zScale' ),
				enumerable: true
			},

			'autoRotate': {
				get() { return controls.autoRotate; },
				set: stateSetter( x => cameraMove.setAutoRotate( !! x ), 'autoRotate' )
			},

			'wheelTilt': {
				get() { return controls.wheelTilt; },
				set( x ) {
					controls.wheelTilt = !! x;
					self.dispatchEvent( { type: 'change', name: 'wheelTilt' } );
				},
				enumerable: true
			},

			'svxControlMode': {
				get() { return controls.svxControlMode; },
				set( x ) {
					controls.svxControlMode = !! x;
					// force refresh of help tab
					self.dispatchEvent( { type: 'newCave', name: 'newCave' } );
				},
				enumerable: true
			},

			'zoomToCursor': {
				get() { return controls.zoomToCursor; },
				set( x ) {
					controls.zoomToCursor = !! x;
					self.dispatchEvent( { type: 'change', name: 'zoomToCursor' } );
				},
				enumerable: true
			},

			'autoRotateSpeed': {
				get() { return controls.autoRotateSpeed / 11; },
				set: stateSetter( setAutoRotateSpeed, 'autoRotateSpeed' )
			},

			'fullscreen': {
				get: isFullscreen,
				set: setFullscreen
			},

			'fog': {
				get() { return useFog; },
				set: stateSetter( setFog, 'fog' ),
				enumerable: true
			},

			'isClipped': {
				get() { return clipped; }
			},

			'maxSnapshotSize': {
				get() {
					const context = renderer.getContext();
					return context.getParameter( context.MAX_RENDERBUFFER_SIZE );
				}
			},

			'focalLength': {
				get() { return cameraManager.focalLength; },
				set: setFocalLength,
				enumerable: true
			}
		} );

		enableLayer( FEATURE_BOX,       'box' );
		enableLayer( FEATURE_ENTRANCES, 'entrances' );
		enableLayer( FEATURE_ENTRANCE_DOTS, 'entrance_dots' );
		enableLayer( FEATURE_STATIONS,  'stations' );
		enableLayer( FEATURE_TRACES,    'traces' );
		enableLayer( FEATURE_GRID,      'grid' );
		enableLayer( FACE_SCRAPS,       'scraps' );
		enableLayer( FACE_MODEL,        'model' );
		enableLayer( FACE_WALLS,        'walls' );
		enableLayer( LEG_CAVE,          'legs' );
		enableLayer( LEG_SPLAY,         'splays' );
		enableLayer( LEG_SURFACE,       'surfaceLegs' );
		enableLayer( LEG_DUPLICATE,     'duplicateLegs' );
		enableLayer( LABEL_STATION,     'stationLabels' );
		enableLayer( LABEL_STATION_COMMENT, 'stationComments' );
		enableLayer( SURVEY_WARNINGS,     'warnings' );

		container.addEventListener( 'pointerover', onPointerOver );
		container.addEventListener( 'pointerleave', onPointerLeave );

		container.addEventListener( 'fullscreenchange', onFullscreenChange );
		container.addEventListener( 'webkitfullscreenchange', onFullscreenChange );

		this.addEventListener( 'change', viewChanged );

		cfg.addEventListener( 'colors', () => {

			container.style.backgroundColor = cfg.themeColorCSS( 'background' );
			renderer.setClearColor( cfg.themeColor( 'background' ), 0.0 );

			if ( survey ) survey.refreshColors();

			renderView();

		} );

		function onPointerOver () { mouseOver = true; }

		function onPointerLeave () { mouseOver = false; }

		function viewChanged( event ) {

			if ( survey !== null && event.name === 'splays' ) {

				survey.stations.setSplaysVisibility( self.splays );

			}

		}

		const hud = new HUD( this, renderer );

		const caveLoader = new CaveLoader( ctx );

		hud.getProgressDial( 0 ).watch( caveLoader );

		const viewState = new ViewState( cfg, this );

		this.renderView = renderView;

		onResize();

		function enableLayer ( layerTag, name ) {

			Object.defineProperty( self, name, {
				get() { return cameraManager.testCameraLayer( layerTag ); },
				set( x ) {

					if ( cameraManager.setCameraLayer( layerTag, x ) ) {

						self.dispatchEvent( { type: 'change', name: name } );

					}

					renderView();
				},
				enumerable: true
			} );

			const hasName = 'has' + name.substr( 0, 1 ).toUpperCase() + name.substr( 1 );

			Object.defineProperty( self, hasName, {
				get() { return survey.hasFeature( layerTag ); }
			} );

		}

		function stateSetter ( modeFunction, name ) {

			return function ( newMode ) {

				modeFunction( isNaN( newMode ) ? newMode : Number( newMode ) );

				self.dispatchEvent( { type: 'change', name: name, value: newMode } );

				renderView();

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

		function setAutoRotateSpeed ( speed ) {

			controls.autoRotateSpeed = Math.max( Math.min( speed, 1.0 ), -1.0 ) * 11;

		}

		function setTerrainShadingMode ( mode ) {

			if ( terrain === null ) return;

			terrain.setShadingMode( mode, renderView );

			if ( terrain.isTiled ) terrain.zoomCheck( cameraManager );

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

		function setFocalLength( f ) {

			const fChange = f / cameraManager.focalLength;

			cameraManager.focalLength = f;

			// adjust camera position to maintain view
			controls.scaleDolly( fChange );

		}

		function onCameraMoved () {

			if ( survey === null ) return;

			lightingManager.setRotation( cameraManager.getRotation() );

			if ( cameraManager.activeCamera.isOrthographicCamera ) {

				ctx.materials.scale =  cameraManager.activeCamera.zoom * survey.scale.z;

			}

			renderView( true );

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

		}

		this.addOverlay = function ( name, overlayProvider ) {

			CommonTerrain.addOverlay( ctx, name, overlayProvider );

		};

		this.addFormatters = function ( stationFormatter ) {

			pointerControls.formatters.station = stationFormatter;

		};

		function cutSection () {

			const selection = survey.selection;

			if ( selection.isEmpty() || selection.isStation() ) return;

			cameraMove.cancel();

			survey.remove( terrain );
			survey.cutSection( selection.getNode() );

			// grab a reference to prevent survey being destroyed in clearView()
			const cutSurvey = survey;

			savedView = viewState.getState();

			// reset view
			self.clearView();

			clipped = true;

			loadSurvey( cutSurvey );

			// move to plan view - required to set zoom limits atm
			cameraMove.prepare( survey.getWorldBoundingBox(), __v.set( 0, 0, -1 ) );
			cameraMove.start( false );

		}

		function selectSection ( node ) {

			if ( node.isStation() ) {

				if ( pointerControls.getEditMode() === MOUSE_MODE_TRACE_EDIT ) {

					pointerControls.selectTraceStation( node );

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

		}

		function onResize () {

			// adjust the renderer to the new canvas size
			const w = container.clientWidth;
			const h = container.clientHeight;

			renderer.setSize( w, h );

			self.dispatchEvent( { type: 'resized', name: 'rts', 'width': w, 'height': h } );

			renderView();

		}

		this.addPlugin = function ( plugin ) {

			new plugin( ctx, renderer, scene );

		};

		this.clearView = function () {

			// clear the current cave model, and clear the screen
			renderer.clear();

			hud.setVisibility( false );

			// terminate all running workers (tile loading/wall building etc)
			ctx.workerPools.terminateActive();

			if ( terrain && terrain.isTiled ) {

				terrain.unwatch( self );

			}

			scene.remove( survey );

			controls.enabled = false;

			survey  = null;
			terrain = null;

			cameraManager.resetCameras();

			controls.reset();

			this.dispatchEvent( { type: 'clear' } );

		};

		this.loadSource = function ( source, section = null ) {

			caveLoader.loadSource( source, section ).then(
				surveyDataCollector => {

					onResize();

					try {

						loadSurvey( new Survey( ctx, surveyDataCollector ) );

					} catch ( e ) {

						alert( e );

					}

				},
				error => {

					alert( `Failed loading cave information: ${error}.`);
					this.clearView();

				}

			);

			clipped = ( section !== null && section !== '' );

		};

		this.loadCave = function ( file, section ) {

			this.loadSource( new ModelSource( [ { name: file } ], false ), section );

		};

		this.loadCaves = function ( files ) {

			this.loadSource( ModelSource.makeModelSourceFiles( files ) );

		};

		this.setView = function ( properties ) {

			// don't render until all settings made.

			renderRequired = false;

			Object.assign( this, properties );

			renderRequired = true;

			renderView();

		};

		this.saveView = function () {

			viewState.saveState();

		};

		this.resetView = function () {

			viewState.clear();
			this.setView( viewState.getDefaultState() );

		};

		this.getView = function () {

			return viewState.getState();

		};

		function setupView ( final ) {

			if ( savedView === null ) {

				self.setView( viewState.getDefaultState() );

			} else {

				self.setView( savedView );

			}

			if ( final ) {

				savedView = null;
				// signal any listeners that we have a new cave

				self.dispatchEvent( { type: 'newCave', name: 'newCave', survey: survey } );

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
			scene.matrixAutoUpdate = false;

			controls.enabled = true;

			survey.getRoutes().addEventListener( 'changed', onSurveyChanged );
			survey.addEventListener( 'changed', onSurveyChanged );

			self.dispatchEvent( { type: 'newSurvey', name: 'newSurvey', survey: survey, publicFactory: publicFactory } );

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

			survey.setShadingMode( survey.caveShading );

		}

		function loadTerrain ( mode ) {

			if ( terrain !== null ) {

				terrain.setVisibility( mode );

				cameraManager.setCameraLayer( FEATURE_TERRAIN, mode );

				self.dispatchEvent( { type: 'change', name: 'terrain' } );

				renderView();

			}

		}

		function renderView ( autorotate = false ) {

			if ( ! renderRequired || renderer.xr.isPresenting ) return;

			// ignore render requests if we are autorotating so don't need
			// extra render calls

			if ( controls.autoRotate && ! autorotate ) return;

			renderer.clear();

			if ( survey !== null ) {

				survey.update( cameraManager, controls.target );

				if ( useFog ) materials.setFog( true );

				cameraManager.activeRenderer();

			}

			if ( useFog ) materials.setFog( false );

			hud.renderHUD();

		}

		this.selectSection = selectSection;
		this.resetRenderer = resetRenderer;
		this.renderView = renderView;
		this.resize = onResize;

		function onCameraMoveEnd () {

			self.dispatchEvent( moveEndEvent );

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

		this.getMouse = function ( x, y ) {

			const boundingRect = container.getBoundingClientRect();

			mouse.set(
				( ( x - boundingRect.left ) / container.clientWidth ) * 2 - 1,
				- ( ( y - boundingRect.top ) / container.clientHeight ) * 2 + 1
			);

			return mouse;

		};

		this.getStationUnderMouse = function ( mouse, station ) {

			if ( survey === null ) return null;

			this.setRaycaster( raycaster, mouse );

			const hit = raycaster.intersectObject( survey.stations, false )[ 0 ];

			return ( hit !== undefined ) ? survey.getWorldPosition( station.copy( hit.station ) ) : null;

		};

		this.setRaycaster = function ( raycaster, mouse ) {

			raycaster.setFromCamera( mouse, cameraManager.activeCamera );

		};

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

			pointerControls.showImagePopup( event, imageUrl );

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

			this.dispatchEvent( { type: 'dispose' } );

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

			container.removeEventListener( 'pointerover', onPointerOver );
			container.removeEventListener( 'pointerleave', onPointerLeave );

			container.removeEventListener( 'fullscreenchange', onFullscreenChange );
			container.removeEventListener( 'webkitfullscreenchange', onFullscreenChange );

			renderer.clear();
			renderer.dispose();

			renderer = null;

		};

	}

}

export { CaveViewer };