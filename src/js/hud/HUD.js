import {
	SHADING_CURSOR, SHADING_DEPTH, SHADING_DEPTH_CURSOR, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_DISTANCE, LEG_CAVE
} from '../core/constants';

import { AHI } from './AHI';
import { AHIControl } from './AHIControl';
import { AngleScale } from './AngleScale';
import { Compass } from './Compass';
import { CompassControl } from './CompassControl';
import { CursorScale } from './CursorScale';
import { CursorControl } from './CursorControl';
import { LinearScale } from './LinearScale';
import { ProgressDial } from './ProgressDial';
import { ScaleBar } from './ScaleBar';
import { HudObject } from './HudObject';

import { Scene, Group, AmbientLight, DirectionalLight, OrthographicCamera } from '../Three';

// THREE objects

function HUD ( viewer, renderer ) {

	const self = this;
	const cfg = viewer.ctx.cfg;

	const container = viewer.container;

	const hHeight = container.clientHeight / 2;
	const hWidth  = container.clientWidth / 2;

	let hScale = 0;

	let linearScale = null;
	let cursorScale = null;
	let scaleBar    = null;
	let cursorControl = null;

	let ahi;
	let compass;
	let angleScale;

	// viewer state

	let isVisible = true;
	let caveLoaded = false;

	// create GL scene and camera for overlay
	const camera = new OrthographicCamera( -hWidth, hWidth, hHeight, -hHeight, 1, 1000 );
	camera.position.z = 600;

	const scene = new Scene();
	scene.name = 'HUD';

	// group to simplyfy resize handling
	const attitudeGroup = new Group();
	attitudeGroup.position.set( hWidth, -hHeight, 0 );

	scene.addStatic( attitudeGroup );

	let hudObject = new HudObject( viewer.ctx );

	const aLight = new AmbientLight( 0x888888 );
	const dLight = new DirectionalLight( 0xFFFFFF );
	dLight.position.set( -1, 1, 1 );

	scene.addStatic( aLight );
	scene.addStatic( dLight );

	const progressDials = [
		new ProgressDial( hudObject, true, 0, viewer ),
		new ProgressDial( hudObject, false, 1, viewer )
	];

	const progressDial = progressDials [ 0 ];

	newAttitudeGroup();

	attitudeGroup.addStatic( progressDials[ 0 ] );
	attitudeGroup.addStatic( progressDials[ 1 ] );

	viewer.addEventListener( 'newCave', caveChanged );
	viewer.addEventListener( 'change', viewChanged );
	viewer.addEventListener( 'resized', resize );

	cfg.addEventListener( 'change', cfgChanged );
	cfg.addEventListener( 'colors', cfgColorChanged );

	const controls = viewer.getControls();

	const compassControl = new CompassControl( hudObject, viewer );
	const ahiControl = new AHIControl( hudObject, viewer );

	function i18n ( text ) {

		const tr = cfg.i18n( 'hud.' + text );

		return ( tr === undefined ) ? text : tr;

	}

	this.setVisibility = function ( visible ) {

		compass.visible = visible;
		ahi.visible = visible;
		progressDial.setVisibility( visible );

		if ( scaleBar ) scaleBar.visible = visible;

		isVisible = visible;

		// reset correct disposition of colour keys etc.
		if ( linearScale ) {

			if ( visible ) {

				viewChanged ( { type: 'change', name: 'shadingMode' } );

			} else {

				linearScale.visible = false;
				cursorScale.visible = false;
				angleScale.visible = false;

			}

		}

		viewer.renderView();

	};

	this.getVisibility = function () {

		return isVisible;

	};

	this.getProgressDial = function ( ring ) {

		return progressDials[ ring ];

	};

	this.setScale = function ( scale ) {

		hScale = scale;

	};

	function resize () {

		const container = viewer.container;

		const hWidth  = container.clientWidth / 2;
		const hHeight = container.clientHeight / 2;

		// adjust cameras to new aspect ratio etc.
		camera.left   = -hWidth;
		camera.right  =  hWidth;
		camera.top    =  hHeight;
		camera.bottom = -hHeight;

		camera.updateProjectionMatrix();

		attitudeGroup.position.set( hWidth, -hHeight, 0 );
		attitudeGroup.updateMatrix();

		newScales();

	}

	this.renderHUD = function () {

		// update HUD components

		const currentCamera = controls.cameraManager.activeCamera;

		compass.set( currentCamera );
		ahi.set( currentCamera );

		updateScaleBar( currentCamera );

		// render on screen
		renderer.clearDepth();
		renderer.render( scene, camera );

	};

	function cfgColorChanged ( /* event */ ) {

		// refresh common config helper
		hudObject = new HudObject( viewer.ctx );

		newAttitudeGroup();
		caveChanged();
	}

	function cfgChanged ( /* event */ ) {

		// only change controls when a cave has been loaded already
		// prevents flicker when racing with i18n resource loading
		if ( caveLoaded ) caveChanged();

	}

	function caveChanged ( /* event */ ) {

		caveLoaded = true;

		newScales();

		viewChanged ( { type: 'change', name: 'shadingMode' } );

	}

	function newAttitudeGroup() {

		if ( ahi ) attitudeGroup.remove( ahi );
		if ( compass ) attitudeGroup.remove( compass );
		if ( angleScale ) attitudeGroup.remove( angleScale );

		ahi = new AHI( hudObject );
		compass = new Compass( hudObject );
		angleScale = new AngleScale( hudObject, i18n( 'inclination' ) );

		attitudeGroup.addStatic( ahi );
		attitudeGroup.addStatic( compass );
		attitudeGroup.addStatic( angleScale );

	}

	function newScales () {

		const container = viewer.container;
		const hasLegs = viewer.minHeight !== Infinity && viewer.maxHeight !== -Infinity;

		if ( linearScale ) {

			linearScale.dispose();
			scene.remove( linearScale );

		}

		if ( hasLegs ) {

			linearScale = new LinearScale( hudObject, container );
			scene.addStatic( linearScale );

		}

		if ( cursorScale ) {

			cursorScale.dispose();
			scene.remove( cursorScale );

		}

		if ( hasLegs ) {

			cursorScale = new CursorScale( hudObject, container );

			if ( cursorControl ) cursorControl.dispose();

			cursorControl = new CursorControl( hudObject, viewer, cursorScale );

			scene.addStatic( cursorScale );

		}

		if ( scaleBar ) {

			scene.remove( scaleBar );
			scaleBar = null;

		}

		updateScaleBar( controls.cameraManager.activeCamera );

		self.setVisibility( isVisible );

	}

	function viewChanged ( event ) {

		if ( event.name !== 'shadingMode' || ! isVisible || ! caveLoaded ) return;

		// hide all - and only make required elements visible

		let useAngleScale = false;
		let useLinearScale = false;
		let useCursorScale = false;

		let stats;

		switch ( viewer.shadingMode ) {

		case SHADING_HEIGHT:

			useLinearScale = true;

			linearScale.setRange( viewer.minHeight, viewer.maxHeight, i18n( 'height' ) );

			break;

		case SHADING_DEPTH:

			useLinearScale = true;

			linearScale.setRange( viewer.maxHeight - viewer.minHeight, 0, i18n( 'depth' ) );

			break;

		case SHADING_DISTANCE:

			useLinearScale = true;

			linearScale.setRange( 0, viewer.maxDistance, i18n( 'distance' ) );

			break;

		case SHADING_CURSOR:

			useCursorScale = true;

			cursorScale.setRange( viewer.minHeight, viewer.maxHeight, i18n( 'height' ) );

			cursorChanged();

			break;

		case SHADING_DEPTH_CURSOR:

			useCursorScale = true;

			cursorScale.setRange( viewer.maxHeight - viewer.minHeight, 0, i18n( 'depth' ) );

			cursorChanged();

			break;

		case SHADING_LENGTH:

			useLinearScale = true;
			stats = viewer.getLegStats( LEG_CAVE );
			linearScale.setRange( stats.minLegLength, stats.maxLegLength, i18n( 'leg_length' ) );

			break;

		case SHADING_INCLINATION:

			useAngleScale = true;

			break;

		}

		angleScale.visible = useAngleScale;
		linearScale.visible= useLinearScale;
		cursorScale.visible = useCursorScale;

		if ( useCursorScale ) {

			viewer.addEventListener( 'cursorChange', cursorChanged );

		} else {

			viewer.removeEventListener( 'cursorChange', cursorChanged );

		}

		viewer.renderView();

	}

	function cursorChanged ( /* event */ ) {

		const cursorHeight = viewer.cursorHeight;
		const range = viewer.maxHeight - viewer.minHeight;

		let scaledHeight = 0;
		let realHeight = 0;

		if ( viewer.shadingMode === SHADING_CURSOR ) {

			scaledHeight = ( viewer.cursorHeight + range / 2 ) / range;
			realHeight = cursorHeight + range / 2 + viewer.minHeight;

		} else {

			scaledHeight = 1 - cursorHeight / range;
			realHeight = cursorHeight;

		}

		scaledHeight = Math.max( Math.min( scaledHeight, 1 ), 0 );

		cursorScale.setCursor( scaledHeight, Math.round( realHeight ) );

	}

	function updateScaleBar ( camera ) {

		if ( camera.isOrthographicCamera ) {

			if ( scaleBar === null ) {

				scaleBar = new ScaleBar( hudObject, viewer.container, hScale, ( hudObject.stdWidth + hudObject.stdMargin ) * 4 );
				scene.addStatic( scaleBar );

			}

			scaleBar.visible = isVisible;
			scaleBar.setScale( camera.zoom );

		} else {

			if ( scaleBar !== null && scaleBar.visible ) scaleBar.visible = false;

		}

	}

	this.dispose = function () {

		ahiControl.dispose();
		compassControl.dispose();
		if ( cursorControl ) cursorControl.dispose();

	};

}

export { HUD };