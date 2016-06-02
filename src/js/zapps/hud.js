"use strict";

var CV = CV || {};

CV.Hud = ( function () {

// THREE objects

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
var isVisible = true;

function init ( domId ) {

	container = document.getElementById( domId );
	viewState = CV.Viewer.getState;

	var hHeight = container.clientHeight / 2;
	var hWidth  = container.clientWidth / 2;

	// create GL scene and camera for overlay
	camera = new THREE.OrthographicCamera( -hWidth, hWidth, hHeight, -hHeight, 1, 1000 );
	camera.position.z = 600;

	scene = new THREE.Scene();

	// group to simplyfy resize handling 
	attitudeGroup = new THREE.Group();
	attitudeGroup.position.set( hWidth, -hHeight, 0 );

	scene.add( attitudeGroup );

	var aLight = new THREE.AmbientLight( 0x888888 );
	var dLight = new THREE.DirectionalLight( 0xFFFFFF );

	dLight.position.set( -1, 1, 1 );

	scene.add( aLight );
	scene.add( dLight );

	compass      = new CV.Compass( container );
	ahi          = new CV.AHI( container );
	progressDial = new CV.ProgressDial();

	attitudeGroup.add( compass );
	attitudeGroup.add( ahi );
	attitudeGroup.add( progressDial );

	window.addEventListener( "resize", resize );

	viewState.addEventListener( "newCave", caveChanged );
	viewState.addEventListener( "change", viewChanged );

}

function setVisibility ( visible ) {

	compass.setVisibility( visible );
	ahi.setVisibility( visible );

	if ( linearScale ) linearScale.setVisibility( visible );
	if ( angleScale ) angleScale.setVisibility( visible );
	if ( scaleBar ) scaleBar.setVisibility( visible );

	isVisible = visible;

	// reset correct disposition of keys etc.
	if ( visible ) viewChanged ( { type: "change", name: "shadingMode" } );

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

		linearScale = new CV.LinearScale( container, viewState );

		scene.add( linearScale );

	}

	if ( angleScale ) {

		scene.remove( angleScale );

		angleScale = new CV.AngleScale( container );

		scene.add( angleScale );

	}

	if ( scaleBar ) {

		scene.remove( scaleBar );

		scaleBar = new CV.ScaleBar( container, hScale, ( CV.HudObject.stdWidth + CV.HudObject.stdMargin ) * 4 );

		scene.add( scaleBar );

	}

	setVisibility ( isVisible ); // set correct visibility of elements

}

function render ( renderer, vCamera, scale ) {

	// update UI components
	compass.set( vCamera );
	ahi.set( vCamera );

	updateScaleBar( scale );

	// render on screen
	renderer.clearDepth();
	renderer.render( scene, camera );

}

function caveChanged ( event ) {

	if ( linearScale ) {

		scene.remove( linearScale );

	}

	linearScale = new CV.LinearScale( container, viewState );

	scene.add( linearScale );

	if ( angleScale ) {

		scene.remove( angleScale );
		angleScale = null;

	}

	if ( scaleBar ) {

		scene.remove( scaleBar );
		scaleBar = null;

	}

	viewChanged ( { type: "change", name: "shadingMode" } );

}

function viewChanged ( event ) {

	if ( event.name !== "shadingMode" || !isVisible ) return;

	switch ( viewState.shadingMode ) {

	case CV.SHADING_HEIGHT:

		if ( angleScale ) angleScale.setVisibility( false );

		if ( linearScale ) linearScale.setRange( viewState.minHeight, viewState.maxHeight, "Height above Datum" ).setMaterial( CV.Materials.getHeightMaterial( CV.MATERIAL_LINE ) ).setVisibility( true );
		viewState.removeEventListener( "cursorChange",  cursorChanged );

		break;

	case CV.SHADING_DEPTH:

		if ( angleScale ) angleScale.setVisibility( false );

		if ( linearScale ) linearScale.setRange( viewState.maxHeight - viewState.minHeight, 0, "Depth below surface" ).setMaterial( CV.Materials.getHeightMaterial( CV.MATERIAL_LINE ) ).setVisibility( true );
		viewState.removeEventListener( "cursorChange",  cursorChanged );

		break;

	case CV.SHADING_CURSOR:

		if ( angleScale ) angleScale.setVisibility( false );

		if ( linearScale ) {

			linearScale.setMaterial( CV.Materials.getCursorMaterial( CV.MATERIAL_LINE ) ).setVisibility( true );

			cursorChanged();

			viewState.addEventListener( "cursorChange",  cursorChanged );

		}

		break;

	case CV.SHADING_LENGTH:

		if ( angleScale ) angleScale.setVisibility( false );

		linearScale.setRange( viewState.minLegLength, viewState.maxLegLength, "Leg length" ).setMaterial( CV.Materials.getHeightMaterial( CV.MATERIAL_LINE ) ).setVisibility( true );
		viewState.removeEventListener( "cursorChange",  cursorChanged );

		break;

	case CV.SHADING_INCLINATION:

		linearScale.setVisibility( false );

		if ( ! angleScale ) {

			angleScale = new CV.AngleScale( container );

			scene.add( angleScale );

		}

		angleScale.setVisibility( true );
		viewState.removeEventListener( "cursorChange",  cursorChanged );

		break;


	case CV.SHADING_CURSOR:

	case CV.SHADING_SINGLE:

	case CV.SHADING_SURVEY:

		if ( angleScale ) angleScale.setVisibility( false );

		linearScale.setVisibility( false );
		viewState.removeEventListener( "cursorChange",  cursorChanged );

		break;

	}

}

function cursorChanged ( event ) {

	var cursorHeight = Math.max( Math.min( viewState.cursorHeight, viewState.maxHeight ), viewState.minHeight );
	linearScale.setRange( viewState.minHeight, viewState.maxHeight, "Cursor:" + Math.round( cursorHeight ) );

}

function updateScaleBar ( scale ) {

	if ( scale === 0 ) {

		if ( scaleBar ) scaleBar.setVisibility( false );

	} else {

		if ( scaleBar === null ) {

			scaleBar = new CV.ScaleBar( container, hScale, ( CV.HudObject.stdWidth + CV.HudObject.stdMargin ) * 4 );
			scene.add( scaleBar );

		}

		scaleBar.setScale( scale ).setVisibility( true );

	}

}

return {
	init:               init,
	render:             render,
	setVisibility:		setVisibility,
	getVisibility:		getVisibility,
	getProgressDial:    getProgressDial,
	setScale:           setScale
};

} () ); // end of Hud Module

// EOF