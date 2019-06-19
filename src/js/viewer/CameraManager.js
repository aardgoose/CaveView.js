
import {
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE, CAMERA_ANAGLYPH, CAMERA_STEREO,
	LEG_CAVE, FEATURE_SELECTED_BOX,
} from '../core/constants';

import { Cfg } from '../core/lib';
import { AnaglyphEffect } from './AnaglyphEffect';
import { StereoEffect } from './StereoEffect';

import {
	OrthographicCamera, PerspectiveCamera,
	Math as _Math
} from '../Three';


function CameraManager ( container, renderer, scene ) {

	const width = container.clientWidth;
	const height = container.clientHeight;

	const orthographicCamera = new OrthographicCamera( -width / 2, width / 2, height / 2, -height / 2, 1, 4000 );
	const perspectiveCamera = new PerspectiveCamera( Cfg.themeValue( 'fieldOfView' ) , width / height, 1, 16000 );

	scene.add( perspectiveCamera );
	scene.add( orthographicCamera );

	initCamera( perspectiveCamera );
	initCamera( orthographicCamera );

	this.activeRenderer = renderer.render.bind( renderer );
	this.activeCamera = perspectiveCamera;
	this.activeEffect = null;

	function initCamera ( camera ) {

		camera.zoom = 1;

		camera.layers.set( 0 );

		camera.layers.enable( LEG_CAVE );
		camera.layers.enable( FEATURE_SELECTED_BOX );

	}

	this.resetCameras = function () {

		initCamera( perspectiveCamera );
		initCamera( orthographicCamera );

	};

	this.setCameraLayer = function ( layerTag, enable ) {

		if ( enable ) {

			perspectiveCamera.layers.enable( layerTag );
			orthographicCamera.layers.enable( layerTag );

		} else {

			perspectiveCamera.layers.disable( layerTag );
			orthographicCamera.layers.disable( layerTag );

		}

		if ( this.activeEffect !== null ) {

			this.activeEffect.setLayers( this.activeCamera.layers.mask );

		}

	};

	this.testCameraLayer = function ( layerTag ) {

		return ( ( this.activeCamera.layers.mask & 1 << layerTag ) > 0 );

	};

	this.resize = function ( width, height ) {

		// adjust cameras to new aspect ratio etc.
		orthographicCamera.left   = -width / 2;
		orthographicCamera.right  =  width / 2;
		orthographicCamera.top    =  height / 2;
		orthographicCamera.bottom = -height / 2;

		orthographicCamera.updateProjectionMatrix();

		perspectiveCamera.aspect = width / height;

		perspectiveCamera.updateProjectionMatrix();

		if ( this.activeEffect !== null ) {

			this.activeEffect.setSize( width, height );

		}

	};

	this.setCamera = function ( mode, target ) {

		const height = container.clientHeight;
		const width = container.clientWidth;

		var offsetLength;
		var activeCamera = this.activeCamera;

		const offset = activeCamera.position.clone().sub( target );

		if ( this.activeEffect !== null ) {

			this.activeEffect.dispose();

		}

		var activeEffect = null;

		switch ( mode ) {

		case CAMERA_STEREO:
		case CAMERA_ANAGLYPH:

			activeEffect = ( mode === CAMERA_STEREO ) ? new StereoEffect( renderer ) : new AnaglyphEffect( renderer, width, height );

			if ( activeCamera.isPerspective ) break;

		case CAMERA_PERSPECTIVE: // eslint-disable-line no-fallthrough

			offsetLength = 4 * height * Math.tan( _Math.DEG2RAD * perspectiveCamera.fov / 2 ) / orthographicCamera.zoom / 2;

			offset.setLength( offsetLength );

			activeCamera = perspectiveCamera;

			break;

		case CAMERA_ORTHOGRAPHIC:

			offsetLength = offset.length();

			orthographicCamera.zoom = 2 * height * Math.tan( _Math.DEG2RAD * perspectiveCamera.fov / 2 ) / offsetLength;

			activeCamera = orthographicCamera;

			break;

		default:

			console.warn( 'unknown camera mode', mode );
			return;

		}

		if ( activeEffect !== null ) {

			activeEffect.setLayers( activeCamera.layers.mask );
			this.activeRenderer = activeEffect.render.bind( activeEffect );

		} else {

			this.activeRenderer = renderer.render.bind( renderer );

		}

		// update new camera with position to give same apparent zoom and view

		activeCamera.position.copy( offset.add( target ) );

		activeCamera.updateProjectionMatrix();
		activeCamera.lookAt( target );

		this.activeCamera = activeCamera;
		this.activeEffect = activeEffect;

	};

	this.setEyeSeparation = function ( x ) {

		// x varies from 0 to 1
		// base separation = 0.064

		if ( this.activeEffect !== null ) {

			this.activeEffect.setEyeSeparation( 0.064 + ( x - 0.5 ) * 0.06 );

		}

	};
}

export { CameraManager };