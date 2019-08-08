/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 * Modified heavily by Angus Sawyer
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

import {
	Euler,
	Math as _Math,
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

var LocationControls = function ( cameraManager ) {

	var scope = this;

	this.enabled = false;

	const alphaOffset = 0; // radians

	const location = new Vector3();

	const thresholdHigh = 60;
	const thresholdLow = 30;

	var deviceOrientation = null;
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

		console.log( 'hr', location );

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

		console.log( 'up' );

		__vector3.copy( location );

		const camera = cameraManager.activeCamera;
		const position = camera.position;

		console.log( camera );
		console.log( cameraManager.mode );

		if ( cameraManager.mode === CAMERA_ORTHOGRAPHIC ) {

			__vector3.z += 500;

			survey.getWorldPosition( __vector3 );

			position.copy( __vector3 );

			//__vector3.z = -Infinity;
			camera.lookAt( __vector3 );

			const width = camera.right - camera.left;
			const height = camera.top - camera.bottom;

			console.log( 'zoom', width, height, survey.scale );

			camera.zoom = Math.min( width, height ) * 1 / ( 2 * accuracyEvent.value * survey.scale.x );

			camera.updateProjectionMatrix();

		} else {

			__vector3.z += 2; // adjust to head height
			survey.getWorldPosition( __vector3 );

			position.copy( __vector3 );

		}

		scope.dispatchEvent( changeEvent );

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

		if ( scope.enabled === false || deviceOrientation === null ) return;

		let alpha = deviceOrientation.alpha ? _Math.degToRad( deviceOrientation.alpha ) + alphaOffset : 0; // Z

		let beta = deviceOrientation.beta ? _Math.degToRad( deviceOrientation.beta ) : 0; // X'

		let gamma = deviceOrientation.gamma ? _Math.degToRad( deviceOrientation.gamma ) : 0; // Y''

		let orient = screenOrientation ? _Math.degToRad( screenOrientation ) : 0; // O

		getQuaternion( __quaternion1, alpha, beta, gamma, orient );

		// get angle to vertical
		__vector3.set( 0, 0, 1 ).applyQuaternion( __quaternion1 );

		const angle = __vector3.angleTo( Object3D.DefaultUp );

		selectCameraType( Math.abs( angle * _Math.RAD2DEG - 90 ) );

		if ( cameraManager.mode === CAMERA_PERSPECTIVE ) {

			cameraManager.activeCamera.quaternion.copy( __quaternion1 );

		}

		scope.dispatchEvent( changeEvent );
		scope.dispatchEvent( endEvent );

	}

	this.hasLocation = function ( newSurvey, locationChecked ) {

		survey = newSurvey;

		if ( 'geolocation' in navigator ) {

			navigator.geolocation.getCurrentPosition( _currentPosition );

		} else {

			locationChecked( false );

		}

		function _currentPosition ( GPSPosition ) {

			console.log( GPSPosition );

			const coords = GPSPosition.coords;

			location.set( coords.longitude, coords.latitude, 0 );

			locationChecked( survey.containsWGS84Position( location ) );

		}

	};

	this.connect = function () {

		onScreenOrientationChangeEvent(); // run once on load

		window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		var geolocation = navigator.geolocation;

		geolocation.getCurrentPosition( onPositionChangeEvent );
		watch = geolocation.watchPosition( onPositionChangeEvent );

		scope.enabled = true;

	};

	this.disconnect = function () {

		window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

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
