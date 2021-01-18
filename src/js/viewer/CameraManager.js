import {
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE, CAMERA_ANAGLYPH, CAMERA_STEREO,
	LEG_CAVE, FEATURE_SELECTED_BOX, FEATURE_SURVEY, FEATURE_TERRAIN
} from '../core/constants';

import { AnaglyphEffect } from './AnaglyphEffect';
import { StereoEffect } from './StereoEffect';

import {
	OrthographicCamera, PerspectiveCamera, MathUtils,
	MeshBasicMaterial, BackSide, Vector2
} from '../Three';

function CameraManager ( ctx, renderer, scene ) {

	const container = ctx.container;

	var width = container.clientWidth;
	var height = container.clientHeight;
	var boundingRect = container.getBoundingClientRect();

	const orthographicCamera = new OrthographicCamera( -width / 2, width / 2, height / 2, -height / 2, 1, 4000 );
	const perspectiveCamera = new PerspectiveCamera( ctx.cfg.themeValue( 'fieldOfView' ) , width / height, 1, 16000 );

	const mouse = new Vector2();

	const self = this;

	scene.add( perspectiveCamera );
	scene.add( orthographicCamera );

	initCamera( perspectiveCamera );
	initCamera( orthographicCamera );

	this.activeCamera = perspectiveCamera;
	this.mode = CAMERA_PERSPECTIVE;

	const backMaterial = new MeshBasicMaterial( { side: BackSide, colorWrite: false } );
	const backMask = 1 << FEATURE_SURVEY | 1 << FEATURE_TERRAIN;

	var savedMask;
	var eyeSeparation = 0.5;
	var lastFrame = 0;

	ctx.viewer.addEventListener( 'resized', onResize );

	function onResize ( e ) {

		width = e.width;
		height = e.height;

		boundingRect = container.getBoundingClientRect();

		// adjust cameras to new aspect ratio etc.

		orthographicCamera.zoom *= width / ( orthographicCamera.right - orthographicCamera.left );

		orthographicCamera.left   = -width / 2;
		orthographicCamera.right  =  width / 2;
		orthographicCamera.top    =  height / 2;
		orthographicCamera.bottom = -height / 2;

		orthographicCamera.updateProjectionMatrix();

		perspectiveCamera.aspect = width / height;

		perspectiveCamera.updateProjectionMatrix();

		if ( self.activeEffect !== null ) {

			self.activeEffect.setSize( width, height );

		}

	}

	const basicRenderer = function () {

		renderer.render( scene, self.activeCamera );
		renderer.getContext().flush();

		lastFrame = renderer.info.render.frame;

	};

	const maskedRenderer = function () {

		// render depth buffer from underside of terrain
		const camera = self.activeCamera;

		if ( self.testCameraLayer( FEATURE_TERRAIN ) ) {

			camera.layers.mask = backMask;
			scene.overrideMaterial = backMaterial;

			renderer.render( scene, camera );

			scene.overrideMaterial = null;
			camera.layers.mask = savedMask;

		}

		renderer.render( scene, camera );
		renderer.getContext().flush();

		lastFrame = renderer.info.render.frame;

	};

	this.maskedTerrain = true;
	this.activeRenderer = maskedRenderer;

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

		savedMask = this.activeCamera.layers.mask;

		if ( this.activeEffect !== null ) {

			this.activeEffect.setLayers( savedMask );

		}

	};

	this.testCameraLayer = function ( layerTag ) {

		return ( ( savedMask & 1 << layerTag ) > 0 );

	};

	this.setCamera = function ( mode, target ) {

		if ( this.mode === mode ) return;

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

			offsetLength = 4 * height * Math.tan( MathUtils.DEG2RAD * perspectiveCamera.fov / 2 ) / orthographicCamera.zoom / 2;

			offset.setLength( offsetLength );

			activeCamera = perspectiveCamera;

			break;

		case CAMERA_ORTHOGRAPHIC:

			offsetLength = offset.length();

			orthographicCamera.zoom = 2 * height * Math.tan( MathUtils.DEG2RAD * perspectiveCamera.fov / 2 ) / offsetLength;

			activeCamera = orthographicCamera;

			break;

		default:

			console.warn( 'unknown camera mode', mode );
			return;

		}

		if ( activeEffect !== null ) {

			activeEffect.setLayers( activeCamera.layers.mask );

			this.activeRenderer = function () {

				activeEffect.render( scene, self.activeCamera );

			};

		} else {

			if ( this.maskedTerrain ) {

				this.activeRenderer = maskedRenderer;

			} else {

				this.activeRenderer = basicRenderer;

			}

		}

		// update new camera with position to give same apparent zoom and view

		activeCamera.position.copy( offset.add( target ) );

		activeCamera.updateProjectionMatrix();
		activeCamera.lookAt( target );

		this.activeCamera = activeCamera;
		this.activeEffect = activeEffect;
		this.mode = mode;

	};

	this.getLastFrame = function () {

		return lastFrame;

	};

	this.getMouse = function ( x, y ) {

		mouse.set(
			( ( x - boundingRect.left ) / container.clientWidth ) * 2 - 1,
			- ( ( y - boundingRect.top ) / container.clientHeight ) * 2 + 1
		);

		return mouse;

	};

	Object.defineProperty( this, 'eyeSeparation', {
		get: function () { return eyeSeparation; },
		set: function ( x ) {

			// x varies from 0 to 1
			// base separation = 0.064
			eyeSeparation = x;

			if ( this.activeEffect !== null ) {

				this.activeEffect.setEyeSeparation( 0.064 + ( x - 0.5 ) * 0.06 );

			}

		}

	} );

}

export { CameraManager };