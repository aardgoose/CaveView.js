
import {
	MATERIAL_LINE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_SINGLE, SHADING_SURVEY, SHADING_PATH,
} from '../core/constants';

import { Viewer } from '../viewer/Viewer';

import { AHI } from './AHI';
import { AngleScale } from './AngleScale';
import { Compass } from './Compass';
import { LinearScale } from './LinearScale';
import { ProgressDial } from './ProgressDial';
import { ScaleBar } from './ScaleBar';
import { HudObject } from './HudObject';

import { Materials } from '../materials/Materials';

import {
	Scene, Group,
	AmbientLight, DirectionalLight,
	OrthographicCamera
} from '../../../../three.js/src/Three';

 
// THREE objects

var renderer;
var camera;
var scene;

var hScale = 0;

var attitudeGroup;

var linearScale = null;
var angleScale  = null ;
var scaleBar    = null;

var compass;
var ahi;
var progressDial;

// DOM objects

var container;

// viewer state

var viewState;
var controls;
var isVisible = true;

function init ( domId, viewRenderer ) {

	container = document.getElementById( domId );
	renderer = viewRenderer;
	viewState = Viewer.getState;

	var hHeight = container.clientHeight / 2;
	var hWidth  = container.clientWidth / 2;

	// create GL scene and camera for overlay
	camera = new OrthographicCamera( -hWidth, hWidth, hHeight, -hHeight, 1, 1000 );
	camera.position.z = 600;

	scene = new Scene();

	// group to simplyfy resize handling
	attitudeGroup = new Group();
	attitudeGroup.position.set( hWidth, -hHeight, 0 );

	scene.add( attitudeGroup );

	var aLight = new AmbientLight( 0x888888 );
	var dLight = new DirectionalLight( 0xFFFFFF );

	dLight.position.set( -1, 1, 1 );

	scene.add( aLight );
	scene.add( dLight );

	compass      = new Compass( container );
	ahi          = new AHI( container );
	progressDial = new ProgressDial();

	attitudeGroup.add( compass );
	attitudeGroup.add( ahi );
	attitudeGroup.add( progressDial );

	window.addEventListener( 'resize', resize );

	viewState.addEventListener( 'newCave', caveChanged );
	viewState.addEventListener( 'change', viewChanged );

	controls = Viewer.getControls();

	controls.addEventListener( 'change', update );

}

function setVisibility ( visible ) {

	compass.setVisibility( visible );
	ahi.setVisibility( visible );
	progressDial.setVisibility( visible );

	if ( linearScale ) linearScale.setVisibility( visible );
	if ( angleScale ) angleScale.setVisibility( visible );
	if ( scaleBar ) scaleBar.setVisibility( visible );

	isVisible = visible;

	// reset correct disposition of keys etc.
	if ( visible ) viewChanged ( { type: 'change', name: 'shadingMode' } );

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

	var hWidth  = container.clientWidth / 2;
	var hHeight = container.clientHeight / 2;

	// adjust cameras to new aspect ratio etc.
	camera.left   = -hWidth;
	camera.right  =  hWidth;
	camera.top    =  hHeight;
	camera.bottom = -hHeight;

	camera.updateProjectionMatrix();

	attitudeGroup.position.set( hWidth, -hHeight, 0 );

	// remove and add a new scale, simpler than rescaling

	if ( linearScale ) {

		scene.remove( linearScale );

		linearScale = new LinearScale( container, viewState );

		scene.add( linearScale );

	}

	if ( angleScale ) {

		scene.remove( angleScale );

		angleScale = new AngleScale( container );

		scene.add( angleScale );

	}

	if ( scaleBar ) {

		scene.remove( scaleBar );

		scaleBar = new ScaleBar( container, hScale, ( HudObject.stdWidth + HudObject.stdMargin ) * 4 );

		scene.add( scaleBar );

	}

	setVisibility ( isVisible ); // set correct visibility of elements

}

function update () {

	// update HUD components

	var camera = controls.object;

	compass.set( camera );
	ahi.set( camera );
	updateScaleBar( camera );

}

function renderHUD () {

	// render on screen
	renderer.clearDepth();
	renderer.render( scene, camera );

}

function caveChanged ( /* event */ ) {

	if ( linearScale ) {

		scene.remove( linearScale );

	}

	linearScale = new LinearScale( container, viewState );

	scene.add( linearScale );

	if ( angleScale ) {

		scene.remove( angleScale );
		angleScale = null;

	}

	if ( scaleBar ) {

		scene.remove( scaleBar );
		scaleBar = null;

	}

	viewChanged ( { type: 'change', name: 'shadingMode' } );

}

function viewChanged ( event ) {

	if ( event.name !== 'shadingMode' || !isVisible ) return;

	switch ( viewState.shadingMode ) {

	case SHADING_HEIGHT:

		if ( angleScale ) angleScale.setVisibility( false );

		if ( linearScale ) linearScale.setRange( viewState.minHeight, viewState.maxHeight, 'Height above Datum' ).setMaterial( Materials.getHeightMaterial( MATERIAL_LINE ) ).setVisibility( true );
		viewState.removeEventListener( 'cursorChange',  cursorChanged );

		break;

	case SHADING_DEPTH:

		if ( angleScale ) angleScale.setVisibility( false );

		if ( linearScale ) linearScale.setRange( viewState.maxHeight - viewState.minHeight, 0, 'Depth below surface' ).setMaterial( Materials.getHeightMaterial( MATERIAL_LINE ) ).setVisibility( true );
		viewState.removeEventListener( 'cursorChange',  cursorChanged );

		break;

	case SHADING_CURSOR:

		if ( angleScale ) angleScale.setVisibility( false );

		if ( linearScale ) {

			linearScale.setMaterial( Materials.getCursorMaterial( MATERIAL_LINE ) ).setVisibility( true );

			cursorChanged();

			viewState.addEventListener( 'cursorChange',  cursorChanged );

		}

		break;

	case SHADING_LENGTH:

		if ( angleScale ) angleScale.setVisibility( false );

		linearScale.setRange( viewState.minLegLength, viewState.maxLegLength, 'Leg length' ).setMaterial( Materials.getHeightMaterial( MATERIAL_LINE ) ).setVisibility( true );
		viewState.removeEventListener( 'cursorChange',  cursorChanged );

		break;

	case SHADING_INCLINATION:

		linearScale.setVisibility( false );

		if ( ! angleScale ) {

			angleScale = new AngleScale( container );

			scene.add( angleScale );

		}

		angleScale.setVisibility( true );
		viewState.removeEventListener( 'cursorChange',  cursorChanged );

		break;

	case SHADING_SINGLE: // eslint-disable-line no-fallthrough

	case SHADING_SURVEY: // eslint-disable-line no-fallthrough

	case SHADING_PATH:

		if ( angleScale ) angleScale.setVisibility( false );

		linearScale.setVisibility( false );
		viewState.removeEventListener( 'cursorChange',  cursorChanged );

		break;

	}

	viewState.refresh();

}

function cursorChanged ( /* event */ ) {

	var cursorHeight = Math.max( Math.min( viewState.cursorHeight, viewState.maxHeight ), viewState.minHeight );
	linearScale.setRange( viewState.minHeight, viewState.maxHeight, 'Cursor:' + Math.round( cursorHeight ) );

}

function updateScaleBar ( camera ) {

	if ( camera instanceof OrthographicCamera ) {

		if ( scaleBar === null ) {

			scaleBar = new ScaleBar( container, hScale, ( HudObject.stdWidth + HudObject.stdMargin ) * 4 );
			scene.add( scaleBar );

		}

		scaleBar.setScale( camera.zoom ).setVisibility( true );

	} else {

		if ( scaleBar ) scaleBar.setVisibility( false );

	}

}

export var HUD = {
	init:               init,
	renderHUD:          renderHUD,
	update:             update,
	setVisibility:		setVisibility,
	getVisibility:		getVisibility,
	getProgressDial:    getProgressDial,
	setScale:           setScale
};

// EOF