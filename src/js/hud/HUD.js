
import {
	MATERIAL_LINE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_DEPTH_CURSOR, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH,
} from '../core/constants';

import { Cfg } from '../core/lib';
import { Viewer } from '../viewer/Viewer';

import { AHI } from './AHI';
import { AngleScale } from './AngleScale';
import { Compass } from './Compass';
import { LinearScale } from './LinearScale';
import { CursorScale } from './CursorScale';
import { ProgressDial } from './ProgressDial';
import { ScaleBar } from './ScaleBar';
import { HudObject } from './HudObject';

import { Materials } from '../materials/Materials';

import {
	Scene, Group,
	AmbientLight, DirectionalLight,
	OrthographicCamera
} from '../Three';

// THREE objects

var renderer;
var camera;
var scene;

var hScale = 0;

var attitudeGroup;

var linearScale = null;
var angleScale  = null;
var cursorScale = null;
var scaleBar    = null;

var compass;
var ahi;
var progressDial;

// DOM objects

var container;

// viewer state

var controls;
var isVisible = true;
var caveLoaded = false;

function init ( containerIn, viewRenderer ) {

	container = containerIn;
	renderer = viewRenderer;

	const hHeight = container.clientHeight / 2;
	const hWidth  = container.clientWidth / 2;

	// create GL scene and camera for overlay
	camera = new OrthographicCamera( -hWidth, hWidth, hHeight, -hHeight, 1, 1000 );
	camera.position.z = 600;

	scene = new Scene();

	// group to simplyfy resize handling
	attitudeGroup = new Group();
	attitudeGroup.position.set( hWidth, -hHeight, 0 );

	scene.add( attitudeGroup );

	const aLight = new AmbientLight( 0x888888 );
	const dLight = new DirectionalLight( 0xFFFFFF );

	dLight.position.set( -1, 1, 1 );

	scene.add( aLight );
	scene.add( dLight );

	compass      = new Compass();
	ahi          = new AHI();
	progressDial = new ProgressDial();

	attitudeGroup.add( compass );
	attitudeGroup.add( ahi );
	attitudeGroup.add( progressDial );

	Viewer.addEventListener( 'newCave', caveChanged );
	Viewer.addEventListener( 'change', viewChanged );

	Cfg.addEventListener( 'change', cfgChanged );

	controls = Viewer.getControls();

}

function i18n ( text ) {

	const tr = Cfg.i18n( 'hud.' + text );

	return ( tr === undefined ) ? text : tr;

}

function setVisibility ( visible ) {

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

			linearScale.setVisibility( false );
			cursorScale.setVisibility( false );
			angleScale.visible = false;

		}

	}

	Viewer.renderView();

}

function getVisibility() {

	return isVisible;

}

function getProgressDial() {

	return progressDial;

}

function setScale( scale ) {

	hScale = scale;

}

function resize () {

	const hWidth  = container.clientWidth / 2;
	const hHeight = container.clientHeight / 2;

	// adjust cameras to new aspect ratio etc.
	camera.left   = -hWidth;
	camera.right  =  hWidth;
	camera.top    =  hHeight;
	camera.bottom = -hHeight;

	camera.updateProjectionMatrix();

	attitudeGroup.position.set( hWidth, -hHeight, 0 );

	newScales();

	setVisibility ( isVisible ); // set correct visibility of elements

}

function renderHUD () {

	// update HUD components

	const currentCamera = controls.object;

	compass.set( currentCamera );
	ahi.set( currentCamera );

	updateScaleBar( currentCamera );

	// render on screen
	renderer.clearDepth();
	renderer.render( scene, camera );

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


function newScales () {

	if ( linearScale ) scene.remove( linearScale );

	linearScale = new LinearScale( container, Viewer );

	scene.add( linearScale );

	if ( cursorScale ) scene.remove( cursorScale );

	cursorScale = new CursorScale( container );

	scene.add( cursorScale );


	if ( angleScale ) scene.remove( angleScale );

	angleScale = new AngleScale( container, i18n( 'inclination' ) );

	scene.add( angleScale );

	if ( scaleBar ) {

		scene.remove( scaleBar );
		scaleBar = null;

	}

	updateScaleBar( controls.object );

}

function viewChanged ( event ) {

	if ( event.name !== 'shadingMode' || ! isVisible || ! caveLoaded ) return;

	// hide all - and only make required elements visible

	var useAngleScale = false;
	var useLinearScale = false;
	var useCursorScale = false;

	switch ( Viewer.shadingMode ) {

	case SHADING_HEIGHT:

		useLinearScale = true;

		linearScale.setRange( Viewer.minHeight, Viewer.maxHeight, i18n( 'above_datum' ) ).setMaterial( Materials.getHeightMaterial( MATERIAL_LINE ) );

		break;

	case SHADING_DEPTH:

		useLinearScale = true;

		linearScale.setRange( Viewer.maxHeight - Viewer.minHeight, 0, i18n( 'below_surface' ) ).setMaterial( Materials.getHeightMaterial( MATERIAL_LINE ) );

		break;

	case SHADING_CURSOR:

		useCursorScale = true;

		cursorScale.setRange( Viewer.minHeight, Viewer.maxHeight, i18n( 'height' ) );

		cursorChanged();

		break;

	case SHADING_DEPTH_CURSOR:

		useCursorScale = true;

		cursorScale.setRange( Viewer.maxHeight - Viewer.minHeight, 0, i18n( 'depth' ) );

		cursorChanged();

		break;

	case SHADING_LENGTH:

		useLinearScale = true;

		linearScale.setRange( Viewer.minLegLength, Viewer.maxLegLength, i18n( 'leg_length' ) ).setMaterial( Materials.getHeightMaterial( MATERIAL_LINE, true ) ).setVisibility( true );

		break;

	case SHADING_INCLINATION:

		useAngleScale = true;

		break;

	}

	angleScale.visible = useAngleScale;
	linearScale.setVisibility( useLinearScale );
	cursorScale.setVisibility( useCursorScale );

	if ( useCursorScale ) {

		Viewer.addEventListener( 'cursorChange', cursorChanged );

	} else {

		Viewer.removeEventListener( 'cursorChange', cursorChanged );

	}

	Viewer.renderView();

}

function cursorChanged ( /* event */ ) {

	const cursorHeight = Viewer.cursorHeight;
	const range = Viewer.maxHeight - Viewer.minHeight;

	var scaledHeight = 0;

	if ( Viewer.shadingMode === SHADING_CURSOR ) {

		scaledHeight = ( Viewer.cursorHeight + range / 2 ) / range;

	} else {

		scaledHeight = 1 - cursorHeight / range;

	}

	scaledHeight = Math.max( Math.min( scaledHeight, 1 ), 0 );

	cursorScale.setCursor( scaledHeight, Math.round( cursorHeight ) );

}

function updateScaleBar ( camera ) {

	if ( camera instanceof OrthographicCamera ) {

		if ( scaleBar === null ) {

			scaleBar = new ScaleBar( container, hScale, ( HudObject.stdWidth + HudObject.stdMargin ) * 4 );
			scene.add( scaleBar );

		}

		if ( isVisible !== scaleBar.visible ) scaleBar.visible = isVisible;

		scaleBar.setScale( camera.zoom );

	} else {

		if ( scaleBar !== null && scaleBar.visible ) scaleBar.visible = false;

	}

}

export const HUD = {
	init:               init,
	renderHUD:          renderHUD,
	setVisibility:		setVisibility,
	getVisibility:		getVisibility,
	getProgressDial:    getProgressDial,
	setScale:           setScale,
	resize:             resize
};

// EOF