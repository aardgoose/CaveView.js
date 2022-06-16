import {
	VERSION,
	FACE_WALLS, FACE_SCRAPS, FEATURE_TRACES, FEATURE_GRID,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE, LEG_DUPLICATE,
	LABEL_STATION, LABEL_STATION_COMMENT,
	FEATURE_BOX, FEATURE_ENTRANCES, FEATURE_STATIONS, FEATURE_ENTRANCE_DOTS
} from '../core/constants';

import { HUD } from '../hud/HUD';
import { Materials } from '../materials/Materials';
import { CameraManager } from './CameraManager';
import { CaveLoader } from '../loaders/CaveLoader';
import { Survey } from './Survey';
import { StationPopup } from './StationPopup';
import { PublicFactory } from '../public/PublicFactory';
import { ImagePopup } from './ImagePopup';
import { Cfg } from '../core/Cfg';
import { WorkerPoolCache } from '../core/WorkerPool';
import { ViewState } from './ViewState';

import {
	EventDispatcher, Vector3, Scene, Raycaster, WebGLRenderer, FogExp2
} from '../Three';

class CaveViewerAR extends EventDispatcher {

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

		const formatters = {};

		let caveIsLoaded = false;
		let publicFactory = null;

		const mouseUpEvent = { type: 'select', node: null };

		let mouseTargets = [];

		let survey = null;

		let useFog = false;

		let renderRequired = true;

		let popup = null;

		// preallocated tmp objects

		const __v = new Vector3();
		const self = this;

		let mouseUpFunction = null;
		let savedView = null;

		// event handler
		window.addEventListener( 'resize', onResize );

		Object.defineProperties( this, {

			'reset': {
				set: function () { setupView( false ); }
			},

			'surveyLoaded': {
				get: function () { return caveIsLoaded; }
			},

			'shadingMode': {
				get: function () { return survey.caveShading; },
				set: stateSetter( setShadingMode, 'shadingMode' ),
				enumerable: true
			},

			'hideMode': {
				get: function () { return survey.hideMode; },
				set: function ( x ) { survey.setHideMode( x ); renderView(); }
			},

			'flatShading': {
				get: function () { return survey.wallsMode; },
				set: function ( x ) { survey.setWallsMode( x ); renderView(); },
				enumerable: true
			},

			'surfaceShading': {
				get: function () { return survey.surfaceShading; },
				set: stateSetter( setSurfaceShadingMode, 'surfaceShading' ),
				enumerable: true
			},

			'duplicateShading': {
				get: function () { return survey.duplicateShading; },
				set: stateSetter( setDuplicateShadingMode, 'duplicateShading' ),
				enumerable: true
			},

			'cursorHeight': {
				get: function () { return materials.cursorHeight; },
				set: setCursorHeight
			},

			'linewidth': {
				get: function () { return ( materials.linewidth - 1 ) / 10; },
				set: stateSetter( setLinewidth, 'linewidth' ),
				enumerable: true
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

			'popup': {
				set: setPopup
			},

			'highlight': {
				set: stateSetter( highlightSelection, 'highlight' )
			},

			'HUD': {
				get: function () { return hud.getVisibility(); },
				set: function ( x ) { hud.setVisibility( x ); },
				enumerable: true
			},

			'fullscreen': {
				get: isFullscreen,
				set: setFullscreen
			},

			'fog': {
				get: function () { return useFog; },
				set: setFog,
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
		enableLayer( FACE_WALLS,        'walls' );
		enableLayer( LEG_CAVE,          'legs' );
		enableLayer( LEG_SPLAY,         'splays' );
		enableLayer( LEG_SURFACE,       'surfaceLegs' );
		enableLayer( LEG_DUPLICATE,     'duplicateLegs' );
		enableLayer( LABEL_STATION,     'stationLabels' );
		enableLayer( LABEL_STATION_COMMENT, 'stationComments' );

		container.addEventListener( 'fullscreenchange', onFullscreenChange );
		container.addEventListener( 'webkitfullscreenchange', onFullscreenChange );

		this.addEventListener( 'change', viewChanged );

		cfg.addEventListener( 'colors', () => {

			if ( survey ) survey.refreshColors();

			renderView();

		} );


		function viewChanged( event ) {

			if ( survey !== null && event.name === 'splays' ) {

				survey.stations.setSplaysVisibility( self.splays );

			}

		}

		const hud = new HUD( this, renderer );

		const caveLoader = new CaveLoader( ctx, caveLoaded );

		hud.getProgressDial( 0 ).watch( caveLoader );

		const viewState = new ViewState( cfg, this );

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
				},
				enumerable: true
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

		function setFog ( enable ) {

			useFog = enable;
			fog.density = useFog ? 0.0025 : 0;

			renderView();

		}

		function setShadingMode ( mode ) {

			survey.setShadingMode( mode, false );

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

		this.addFormatters = function ( stationFormatter ) {

			formatters.station = stationFormatter;

		};

		function highlightSelection ( node ) {

			survey.highlightSelection( node );

			renderView();

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

			scene.remove( survey );

			survey          = null;
			mouseTargets    = [];

			// remove event listeners

			container.removeEventListener( 'mousedown', onMouseDown );

			cameraManager.resetCameras();

			this.dispatchEvent( { type: 'clear' } );

		};

		this.loadCave = function ( file ) {

			caveLoader.loadFile( file );

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

		this.setView = function ( properties ) {

			// don't render until all settings made.
			if ( ! renderRequired ) return;

			renderRequired = false;

			Object.assign( this, properties );

			renderRequired = true;

			renderView();

		};


		this.resetView = function () {

			viewState.clear();
			self.setView( viewState.getDefaultState() );

		};

		function setupView ( final ) {

			renderRequired = true;

			if ( savedView === null ) {

				self.setView( viewState.getDefaultState() );

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

			setScale();

			materials.flushCache();
			publicFactory = new PublicFactory( survey );

			scene.addStatic( survey );

			mouseTargets = survey.pointTargets;

			scene.matrixAutoUpdate = false;

			container.addEventListener( 'mousedown', onMouseDown, false );

			survey.getRoutes().addEventListener( 'changed', onSurveyChanged );
			survey.addEventListener( 'changed', onSurveyChanged );

			caveIsLoaded = true;

			setupView( true );

		}

		function onSurveyChanged ( /* event */ ) {

			setShadingMode( survey.caveShading );

		}

		function showStationImagePopup ( station, imageUrl ) {

			if ( popup !== null ) return;

			popup = new ImagePopup( ctx, station, imageUrl, renderView );
			survey.addStatic( popup );

			renderView();

		}

		function showStationPopup ( pStation ) {

			if ( popup !== null ) return;

			popup = new StationPopup( ctx, pStation, survey, formatters.station, false, self.warnings );
			survey.addStatic( popup );

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

		function showStationPopupX ( station ) {

			showStationPopup( station );

			mouseUpFunction = closePopup;

		}

		function mouseUp () {

			container.removeEventListener( 'mouseup', mouseUp );

			if ( mouseUpFunction ) mouseUpFunction();

			renderView();

			self.dispatchEvent( mouseUpEvent );

		}

		function selectStation ( station, event ) {

			survey.selectStation( station );

			const pStation = publicFactory.getStation( station );

			const selectEvent = {
				type: 'station',
				node: pStation,
				handled: false,
				mouseEvent: event,
			};

			self.dispatchEvent( selectEvent );

			if ( selectEvent.handled ) return;

			showStationPopupX( pStation, event );

		}

		function onMouseDown ( event ) {

			if ( event.target !== renderer.domElement ) return;

			const mouse = cameraManager.getMouse( event.clientX, event.clientY );

			raycaster.setFromCamera( mouse, cameraManager.activeCamera );

			container.addEventListener( 'mouseup', mouseUp );

			if ( self.entrances ) {

				const entrance = raycaster.intersectObjects( survey.entrances.labels, false )[ 0 ];

				if ( entrance !== undefined ) {

					const station = survey.surveyTree.findById( entrance.object.stationID );

					const e = {
						type: 'entrance',
						displayName: entrance.name,
						station: publicFactory.getStation( station ),
						handled: false,
						mouseEvent: event
					};

					self.dispatchEvent( e );

					if ( ! e.handled ) {

						selectStation( station, event );

					}

					return;

				}

			}

			const hit = raycaster.intersectObjects( mouseTargets, false )[ 0 ];

			if ( hit === undefined ) return;
			selectStation( hit.station, event );


		}

		function renderView () {

			if ( ! renderRequired ) return;

			// ignore render requests if we are autorotating so don't need
			// extra render calls

			renderer.clear();

			if ( caveIsLoaded ) {

				survey.update( cameraManager );

				if ( useFog ) materials.setFog( true );

				cameraManager.activeRenderer();

			}

			if ( useFog ) materials.setFog( false );

			hud.renderHUD();

		}

		this.resetRenderer = resetRenderer;
		this.renderView = renderView;
		this.resize = onResize;

		function setScale () {

			const range = survey.combinedLimits.getSize( __v );

			let hScale = Math.min( container.clientWidth / range.x, container.clientHeight / range.y );

			if ( hScale === Infinity ) hScale = 1;

			// scaling to compensate distortion introduced by projection ( x and y coords only ) - approx only
			const vScale = hScale * survey.scaleFactor;

			survey.setScale( hScale, vScale );

			hud.setScale( vScale );

		}

		this.showImagePopup = function ( event, imageUrl ) {

			showStationImagePopup( event.node, imageUrl );
			mouseUpFunction = closePopup;

		};

		this.dispose = function () {

			ctx.workerPools.dispose();
			scene.remove( survey );
			hud.dispose();

			ctx.glyphStringCache = null;
			ctx.cfg = null;
			ctx.workerPools = null;
			ctx.materials = null;
			ctx.container = null;

			window.removeEventListener( 'resize', onResize );

			container.removeChild( renderer.domElement );

			container.removeEventListener( 'mousedown', onMouseDown );

			container.removeEventListener( 'fullscreenchange', onFullscreenChange );
			container.removeEventListener( 'webkitfullscreenchange', onFullscreenChange );

			renderer.clear();
			renderer.dispose();

			renderer = null;

		};

	}

}

export { CaveViewerAR };