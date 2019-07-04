/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 * Modified heavily by Angus Sawyer
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

import {
	Euler,
	Math as _Math,
	Vector3, Box3,
	Quaternion,
	Object3D,
	EventDispatcher
} from '../Three';

import { CAMERA_PERSPECTIVE, CAMERA_ORTHOGRAPHIC, CAMERA_NONE } from '../core/constants';

const down = new Vector3( 0, 0, -1 );

const __vector3 = new Vector3();
const __box3 = new Box3();
const __euler = new Euler();
const __quaternion1 = new Quaternion();
const __quaternion2 = new Quaternion();

const changeEvent = { type: 'change' };
const endEvent = { type: 'end' };

var survey = null;

var LocationControls = function ( viewer, cameraManager, mover ) {

	var scope = this;

	this.cameraManager = cameraManager;
	this.cameraMove = mover;

	this.enabled = false;

	this.deviceOrientation = {};
	this.screenOrientation = 0;
	this.thresholdHigh = 60;
	this.thresholdLow = 30;

	this.alphaOffset = 0; // radians
	this.watch = null;
	this.location = new Vector3();
	this.gettingHeight = false;

	function onDeviceOrientationChangeEvent ( event ) {

		scope.deviceOrientation = event;
		scope.update();

	}

	function onScreenOrientationChangeEvent () {

		scope.screenOrientation = window.orientation || 0;
		scope.update();

	}

	function onPositionChangeEvent ( GPSPosition ) {

		if ( scope.gettingHeight ) return;

		scope.gettingHeight = true;

		const coords = GPSPosition.coords;

		var location = scope.location;

		location.set( coords.longitude, coords.latitude, 0 );

		survey.getModelSurfaceFromWGS84( location, onHeightReturned );

	}

	function onHeightReturned () {

		console.log( 'hr', scope.location );

		updatePosition();

		scope.gettingHeight = false;

	}

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	function getQuaternion ( quaternion, alpha, beta, gamma, orient ) {

		__euler.set( beta, - gamma, alpha, 'ZXY' ); // 'ZXY' for the device, but 'YXZ' for us

		quaternion.setFromEuler( __euler ); // orient the device

		quaternion.multiply( __quaternion2.setFromAxisAngle( Object3D.DefaultUp, - orient ) ); // adjust for screen orientation

	}

	function updatePosition () {

		console.log( 'up' );

		const cameraMove = scope.cameraMove;

		__vector3.copy( scope.position );

		if ( viewer.cameraType === CAMERA_ORTHOGRAPHIC ) {

			// FIXME - scale to real world sizes adjusted by accuracy
			__box3.setFromCenterAndSize(
				survey.getWorldPosition( __vector3 ),
				new Vector3( 100, 100, 0 )
			);

			cameraMove.prepare( __box3, down );

		} else {

			__vector3.z += 2; // adjust camera position to local surface
			cameraMove.prepareSimpleMove( survey.getWorldPosition( __vector3 ) );

		}

		scope.update();

		cameraMove.start();

	}

	function selectCameraType ( angle ) {

		var cameraType = viewer.cameraType;

		// apply hysteresis

		if ( angle > scope.thresholdHigh ) {

			cameraType = CAMERA_ORTHOGRAPHIC;

		} else if ( angle < scope.thresholdLow ) {

			cameraType = CAMERA_PERSPECTIVE;

		} else if ( cameraType === CAMERA_NONE ) {

			cameraType = CAMERA_ORTHOGRAPHIC;

		}

		if ( cameraType !== viewer.cameraType ) {

			viewer.cameraType = cameraType;

			updatePosition();

		}

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
			const location = scope.location;

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
		scope.watch = geolocation.watchPosition( onPositionChangeEvent );

		scope.enabled = true;

	};

	this.disconnect = function () {

		window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		navigator.geolocation.clearWatch( this.watch );

		scope.enabled = false;

	};

	this.update = function () {

		if ( scope.enabled === false ) return;

		var device = scope.deviceOrientation;

		if ( device ) {

			let alpha = device.alpha ? _Math.degToRad( device.alpha ) + scope.alphaOffset : 0; // Z

			let beta = device.beta ? _Math.degToRad( device.beta ) : 0; // X'

			let gamma = device.gamma ? _Math.degToRad( device.gamma ) : 0; // Y''

			let orient = scope.screenOrientation ? _Math.degToRad( scope.screenOrientation ) : 0; // O

			getQuaternion( __quaternion1, alpha, beta, gamma, orient );

			// get angle to vertical
			__vector3.set( 0, 0, 1 ).applyQuaternion( __quaternion1 );

			const angle = __vector3.angleTo( Object3D.DefaultUp );

			selectCameraType( Math.abs( angle * _Math.RAD2DEG - 90 ) );

			if ( viewer.cameraType === CAMERA_PERSPECTIVE ) {

				scope.cameraManager.activeCamera.quaternion.copy( __quaternion1 );

			}

		}

		scope.dispatchEvent( changeEvent );
		scope.dispatchEvent( endEvent );

	};

	this.dispose = function () {

		scope.disconnect();

	};

};

LocationControls.prototype = Object.create( EventDispatcher.prototype );
LocationControls.prototype.constructor = LocationControls;

export { LocationControls };
