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

var DeviceOrientationControls = function ( cameraManager, mover ) {

	var scope = this;

	this.cameraManager = cameraManager;
	this.cameraMove = mover;

	this.enabled = false;

	this.deviceOrientation = {};
	this.screenOrientation = 0;
	this.thresholdHigh = 60;
	this.thresholdLow = 30;
	this.cameraType = CAMERA_NONE;

	this.alphaOffset = 0; // radians
	this.survey = null;
	this.watch = null;
	this.position = new Vector3();
	this.gettingHeight = false;

	var onDeviceOrientationChangeEvent = function ( event ) {

		scope.deviceOrientation = event;
		scope.update();

	};

	var onScreenOrientationChangeEvent = function () {

		scope.screenOrientation = window.orientation || 0;
		scope.update();

	};

	var onPositionChange = function ( GPSPosition ) {

		if ( scope.gettingHeight ) return;

		scope.gettingHeight = true;

		const coords = GPSPosition.coords;

		var position = scope.position;

		position.set( coords.longitude, coords.latitude, 0 );

		scope.survey.getModelSurfaceFromWGS84( position, onHeightReturned );

	};

	var onHeightReturned = function () {

		console.log( 'hr', scope.position );

		scope.updatePosition();

		scope.gettingHeight = false;

	};

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	var getQuaternion = function ( quaternion, alpha, beta, gamma, orient ) {

		__euler.set( beta, - gamma, alpha, 'ZXY' ); // 'ZXY' for the device, but 'YXZ' for us

		quaternion.setFromEuler( __euler ); // orient the device

		quaternion.multiply( __quaternion2.setFromAxisAngle( Object3D.DefaultUp, - orient ) ); // adjust for screen orientation

	};

	this.connect = function () {

		onScreenOrientationChangeEvent(); // run once on load

		window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		var geolocation = navigator.geolocation;

		geolocation.getCurrentPosition( onPositionChange );
		scope.watch = geolocation.watchPosition( onPositionChange );

		scope.enabled = true;

	};

	this.disconnect = function () {

		window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		navigator.geolocation.clearWatch( this.watch );
		scope.cameraType = CAMERA_NONE;

		scope.enabled = false;

	};

	this.update = function () {

		if ( scope.enabled === false ) return;

		var device = scope.deviceOrientation;

		if ( device ) {

			var alpha = device.alpha ? _Math.degToRad( device.alpha ) + scope.alphaOffset : 0; // Z

			var beta = device.beta ? _Math.degToRad( device.beta ) : 0; // X'

			var gamma = device.gamma ? _Math.degToRad( device.gamma ) : 0; // Y''

			var orient = scope.screenOrientation ? _Math.degToRad( scope.screenOrientation ) : 0; // O

			getQuaternion( __quaternion1, alpha, beta, gamma, orient );

			// get angle to vertical
			__vector3.set( 0, 0, 1 ).applyQuaternion( __quaternion1 );

			const angle = __vector3.angleTo( Object3D.DefaultUp );

			scope.selectCameraType( Math.abs( angle - 90 ) );
			/*
			if ( scope.positionChanged ) {

				scope.updatePosition();
				return;

			}
			*/
			scope.cameraManager.activeCamera.quaternion.copy( __quaternion1 );

		}

		scope.dispatchEvent( changeEvent );
		scope.dispatchEvent( endEvent );

	};

	this.updatePosition = function () {

		console.log( 'up', scope.position );
		__vector3.copy( scope.position );

		if ( scope.cameraType === CAMERA_ORTHOGRAPHIC ) {

			// FIXME - scale to real world sizes adjusted by accuracy
			__box3.setFromCenterAndSize(
				scope.survey.getWorldPosition( __vector3 ),
				new Vector3( 100, 100, 0 )
			);

			scope.cameraMove.prepare( __box3, down );

		} else {

			__vector3.z += 2; // adjust camera position to local surface
			scope.cameraMove.prepareSimpleMove( scope.survey.getWorldPosition( __vector3 ) );

		}

		scope.cameraMove.start();

	};

	this.selectCameraType = function ( angle ) {

		var cameraType = this.cameraType;

		// apply hysteresis

		if ( angle > this.thresholdHigh ) {

			cameraType = CAMERA_ORTHOGRAPHIC;

		} else if ( angle < this.thresholdLow ) {

			cameraType = CAMERA_PERSPECTIVE;

		} else if ( cameraType === CAMERA_NONE ) {

			cameraType = CAMERA_ORTHOGRAPHIC;

		}

		if ( cameraType !== this.cameraType ) {

			scope.cameraManager.setCamera( cameraType, new Vector3() );
			scope.cameraType = cameraType;

			scope.updatePosition();

		}

	};

	this.dispose = function () {

		scope.disconnect();

	};

};

DeviceOrientationControls.prototype = Object.create( EventDispatcher.prototype );
DeviceOrientationControls.prototype.constructor = DeviceOrientationControls;

export { DeviceOrientationControls };
