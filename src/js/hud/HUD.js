
import {
	MATERIAL_LINE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_DEPTH_CURSOR, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_DISTANCE
} from '../core/constants';

import { Cfg } from '../core/lib';

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

var progressDials;
var progressDial;

// viewer state

var viewer;
var controls;

var isVisible = true;
var caveLoaded = false;

function init ( viewerIn, viewRenderer ) {

	viewer = viewerIn;
	renderer = viewRenderer;

	const container = viewer.container;

	const hHeight = container.clientHeight / 2;
	const hWidth  = container.clientWidth / 2;

	// create GL scene and camera for overlay
	camera = new OrthographicCamera( -hWidth, hWidth, hHeight, -hHeight, 1, 1000 );
	camera.position.z = 600;

	scene = new Scene();

	// group to simplyfy resize handling
	attitudeGroup = new Group();
	attitudeGroup.position.set( hWidth, -hHeight, 0 );

	scene.addStatic( attitudeGroup );

	scene.matrixAutoUpdate = false;
	scene.name = 'HUD';

	const aLight = new AmbientLight( 0x888888 );
	const dLight = new DirectionalLight( 0xFFFFFF );

	dLight.position.set( -1, 1, 1 );

	scene.addStatic( aLight );
	scene.addStatic( dLight );

	compass      = new Compass();
	ahi          = new AHI();

	progressDials = [ new ProgressDial( true, 0 ), new ProgressDial( false, 1 ) ];

	progressDial = progressDials [ 0 ];

	attitudeGroup.addStatic( compass );
	attitudeGroup.addStatic( ahi );

	attitudeGroup.addStatic( progressDials[ 0 ] );
	attitudeGroup.addStatic( progressDials[ 1 ] );

	viewer.addEventListener( 'newCave', caveChanged );
	viewer.addEventListener( 'change', viewChanged );
	viewer.addEventListener( 'resized', resize );

	Cfg.addEventListener( 'change', cfgChanged );

	controls = viewer.getControls();

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

			linearScale.visible = false;
			cursorScale.visible = false;
			angleScale.visible = false;

		}

	}

	viewer.renderView();

}

function getVisibility() {

	return isVisible;

}

function getProgressDial( ring ) {

	return progressDials[ ring ];

}

function setScale( scale ) {

	hScale = scale;

}

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

	const container = viewer.container;

	if ( linearScale ) scene.remove( linearScale );

	linearScale = new LinearScale( container, viewer );

	scene.addStatic( linearScale );

	if ( cursorScale ) scene.remove( cursorScale );

	cursorScale = new CursorScale( container );

	scene.addStatic( cursorScale );

	if ( angleScale ) scene.remove( angleScale );

	angleScale = new AngleScale( container, i18n( 'inclination' ) );

	scene.addStatic( angleScale );

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

	switch ( viewer.shadingMode ) {

	case SHADING_HEIGHT:

		useLinearScale = true;

		linearScale.setRange( viewer.minHeight, viewer.maxHeight, i18n( 'height' ) ).setMaterial( Materials.getHeightMaterial( MATERIAL_LINE ) );

		break;

	case SHADING_DEPTH:

		useLinearScale = true;

		linearScale.setRange( viewer.maxHeight - viewer.minHeight, 0, i18n( 'depth' ) ).setMaterial( Materials.getHeightMaterial( MATERIAL_LINE ) );

		break;

	case SHADING_DISTANCE:

		useLinearScale = true;

		linearScale.setRange( 0, viewer.maxDistance, i18n( 'distance' ) ).setMaterial( Materials.getHeightMaterial( MATERIAL_LINE ) );

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

		linearScale.setRange( viewer.minLegLength, viewer.maxLegLength, i18n( 'leg_length' ) ).setMaterial( Materials.getHeightMaterial( MATERIAL_LINE, true ) );

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

	var scaledHeight = 0;

	if ( viewer.shadingMode === SHADING_CURSOR ) {

		scaledHeight = ( viewer.cursorHeight + range / 2 ) / range;

	} else {

		scaledHeight = 1 - cursorHeight / range;

	}

	scaledHeight = Math.max( Math.min( scaledHeight, 1 ), 0 );

	cursorScale.setCursor( scaledHeight, Math.round( cursorHeight + range / 2 + viewer.minHeight ) );

}

function updateScaleBar ( camera ) {

	if ( camera instanceof OrthographicCamera ) {

		if ( scaleBar === null ) {

			scaleBar = new ScaleBar( viewer.container, hScale, ( HudObject.stdWidth + HudObject.stdMargin ) * 4 );
			scene.addStatic( scaleBar );

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
	setScale:           setScale
};

// EOF