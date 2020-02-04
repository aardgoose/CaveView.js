/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 * Modified heavily by Angus Sawyer
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

import {
	Euler,
	MathUtils,
	Vector2,
	Vector3,
	Quaternion,
	Object3D,
	EventDispatcher
} from '../Three';

import { CAMERA_PERSPECTIVE, CAMERA_ORTHOGRAPHIC, CAMERA_NONE } from '../core/constants';

const __vector3 = new Vector3();
const __euler = new Euler();
const __quaternion1 = new Quaternion();
const __quaternion2 = new Quaternion();

const changeEvent = { type: 'change' };
const endEvent = { type: 'end' };
const accuracyEvent = { type: 'accuracy', value: 1000 };

var survey = null;

var LocationControls = function ( cameraManager, ctx ) {

	var scope = this;

	this.enabled = false;

	const alphaOffset = 0; // radians

	const location = new Vector3();

	const thresholdHigh = 60;
	const thresholdLow = 30;

	const lastTouch = new Vector2();
	const currentTouch = new Vector2();

	var touchDirection = 0;

	const container = ctx.container;
	const materials = ctx.materials;

	var deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };
	var screenOrientation = null;

	var watch = null;
	var gettingHeight = false;

	this.location = location;

	function onDeviceOrientationChangeEvent ( event ) {

		deviceOrientation = event;
		updateOrientation();

	}

	function onScreenOrientationChangeEvent () {

		screenOrientation = window.orientation || 0;
		updateOrientation();

	}

	function onPositionChangeEvent ( GPSPosition ) {

		if ( gettingHeight ) return;

		gettingHeight = true;

		const coords = GPSPosition.coords;

		if ( coords.accuracy !== accuracyEvent.value ) {

			accuracyEvent.value = coords.accuracy;
			scope.dispatchEvent( accuracyEvent );

		}

		location.set( coords.longitude, coords.latitude, 0 );
		survey.getModelSurfaceFromWGS84( location, onHeightReturned );

	}

	function onHeightReturned () {

		updatePosition();
		gettingHeight = false;

	}

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	function getQuaternion ( quaternion, alpha, beta, gamma, orient ) {

		__euler.set( beta, - gamma, alpha, 'ZXY' ); // 'ZXY' for the device, but 'YXZ' for us

		quaternion.setFromEuler( __euler ); // orient the device

		quaternion.multiply( __quaternion2.setFromAxisAngle( Object3D.DefaultUp, - orient ) ); // adjust for screen orientation

	}

	function updatePosition () {

		__vector3.copy( location );

		const camera = cameraManager.activeCamera;
		const position = camera.position;

		if ( cameraManager.mode === CAMERA_ORTHOGRAPHIC ) {

			__vector3.z += 500;

			survey.getWorldPosition( __vector3 );

			position.copy( __vector3 );

			//__vector3.z = -Infinity;
			camera.lookAt( __vector3 );

			const width = camera.right - camera.left;
			const height = camera.top - camera.bottom;

			camera.zoom = Math.min( width, height ) / ( 2 * accuracyEvent.value * survey.scale.x );

			camera.updateProjectionMatrix();

		} else {

			__vector3.z += 2; // adjust to head height
			survey.getWorldPosition( __vector3 );

			position.copy( __vector3 );

		}

		scope.dispatchEvent( changeEvent );
		scope.dispatchEvent( endEvent );

	}

	function selectCameraType ( angle ) {

		var cameraType = cameraManager.mode;

		// apply hysteresis

		if ( angle > thresholdHigh ) {

			cameraType = CAMERA_ORTHOGRAPHIC;

		} else if ( angle < thresholdLow ) {

			cameraType = CAMERA_PERSPECTIVE;

		} else if ( cameraType === CAMERA_NONE ) {

			cameraType = CAMERA_ORTHOGRAPHIC;

		}

		if ( cameraType !== cameraManager.mode ) {

			cameraManager.setCamera( cameraType, location );

			updatePosition();

		}

	}

	function updateOrientation () {

		if ( scope.enabled === false ) return;

		let alpha = deviceOrientation.alpha ? MathUtils.degToRad( deviceOrientation.alpha ) + alphaOffset : 0; // Z

		let beta = deviceOrientation.beta ? MathUtils.degToRad( deviceOrientation.beta ) : 0; // X'

		let gamma = deviceOrientation.gamma ? MathUtils.degToRad( deviceOrientation.gamma ) : 0; // Y''

		let orient = screenOrientation ? MathUtils.degToRad( screenOrientation ) : 0; // O

		getQuaternion( __quaternion1, alpha, beta, gamma, orient );

		// get angle to vertical
		__vector3.set( 0, 0, 1 ).applyQuaternion( __quaternion1 );

		const angle = __vector3.angleTo( Object3D.DefaultUp );

		selectCameraType( Math.abs( angle * MathUtils.RAD2DEG - 90 ) );

		if ( cameraManager.mode === CAMERA_PERSPECTIVE ) {

			cameraManager.activeCamera.quaternion.copy( __quaternion1 );

		} else {

			cameraManager.activeCamera.setRotationFromAxisAngle( Object3D.DefaultUp, alpha );

		}

		scope.dispatchEvent( changeEvent );
		scope.dispatchEvent( endEvent );

	}

	function onTouchStart ( event ) {

		const touch = event.touches.item( 0 );

		lastTouch.set( touch.clientX, touch.clientY );
		touchDirection = 0;

	}

	function onTouchMove ( event ) {

		const camera = cameraManager.activeCamera;
		const touch = event.touches.item( 0 );

		currentTouch.set( touch.clientX, touch.clientY );
		lastTouch.sub( currentTouch );

		const deltaX= 100 * lastTouch.x / container.clientWidth;
		const deltaY= 100 * lastTouch.y / container.clientHeight;

		if ( touchDirection === 0 ) {

			touchDirection = Math.abs( deltaY ) > Math.abs( deltaX ) ? 1 : -1;

		}

		if ( touchDirection === 1 ) {

			camera.zoom += deltaY;
			camera.updateProjectionMatrix();

		} else {

			materials.distanceTransparency -= deltaX;
			console.log( 'dt', materials.distanceTransparency );
		}

		lastTouch.copy( currentTouch );
		scope.dispatchEvent( changeEvent );

	}

	function onTouchEnd ( /* event */ ) {

		touchDirection = 0;

	}

	this.hasLocation = function ( newSurvey, locationChecked ) {

		survey = newSurvey;

		if ( 'geolocation' in navigator && survey.CRS !== null ) {

			navigator.geolocation.getCurrentPosition( _currentPosition );

		}

		function _currentPosition ( GPSPosition ) {

			console.log( GPSPosition );

			const coords = GPSPosition.coords;

			location.set( coords.longitude, coords.latitude, 0 );

			if ( survey.containsWGS84Position( location ) ) {

				locationChecked();

			}

		}

	};

	this.connect = function () {

		onScreenOrientationChangeEvent(); // run once on load

		window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		container.addEventListener( 'touchstart', onTouchStart, false );
		container.addEventListener( 'touchend', onTouchEnd, false );
		container.addEventListener( 'touchmove', onTouchMove, false );

		var geolocation = navigator.geolocation;

		geolocation.getCurrentPosition( onPositionChangeEvent );
		watch = geolocation.watchPosition( onPositionChangeEvent );

		scope.enabled = true;

		updateOrientation();

	};

	this.disconnect = function () {

		window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		container.addEventListener( 'touchstart', onTouchStart, false );
		container.addEventListener( 'touchend', onTouchEnd, false );
		container.addEventListener( 'touchmove', onTouchMove, false );

		navigator.geolocation.clearWatch( watch );

		scope.enabled = false;

	};

	this.dispose = function () {

		scope.disconnect();

	};

};

LocationControls.prototype = Object.create( EventDispatcher.prototype );
LocationControls.prototype.constructor = LocationControls;

export { LocationControls };
