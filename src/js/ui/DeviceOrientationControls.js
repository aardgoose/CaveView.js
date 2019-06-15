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
	Object3D
} from '../Three';

import { CAMERA_PERSPECTIVE, CAMERA_ORTHOGRAPHIC, CAMERA_NONE } from '../core/constants';

const _box3 = new Box3();

var DeviceOrientationControls = function ( object, onMove, setCamera, mover ) {

	var scope = this;

	this.object = object;
	this.onMove = onMove;
	this.setCamera = setCamera;
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

	var onDeviceOrientationChangeEvent = function ( event ) {
		console.log( 'orientation' );
		scope.deviceOrientation = event;
		scope.update();

	};

	var onScreenOrientationChangeEvent = function () {

		scope.screenOrientation = window.orientation || 0;
		scope.update();

	};

	var onPositionChange = function ( GPSPosition ) {

		console.log( 'position' );

		const coords = GPSPosition.coords;

		var position = scope.position;

		position.set( coords.longitude, coords.latitude, 0 );

		scope.survey.getModelSurfaceFromWGS84( position );

		scope.update();

	};

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	var setObjectQuaternion = function () {

		var euler = new Euler();
		var q0 = new Quaternion();

		return function ( quaternion, alpha, beta, gamma, orient ) {

			euler.set( beta, - gamma, alpha, 'ZXY' ); // 'ZXY' for the device, but 'YXZ' for us

			quaternion.setFromEuler( euler ); // orient the device

			quaternion.multiply( q0.setFromAxisAngle( Object3D.DefaultUp, - orient ) ); // adjust for screen orientation

		};

	}();

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

		const position = scope.position;

		console.log( 'pos', position );

		var device = scope.deviceOrientation;
		const camera = scope.object;

		if ( device ) {

			var alpha = device.alpha ? _Math.degToRad( device.alpha ) + scope.alphaOffset : 0; // Z

			var beta = device.beta ? _Math.degToRad( device.beta ) : 0; // X'

			var gamma = device.gamma ? _Math.degToRad( device.gamma ) : 0; // Y''

			var orient = scope.screenOrientation ? _Math.degToRad( scope.screenOrientation ) : 0; // O

			scope.selectCameraType( 0 ); // FIXME angle

			setObjectQuaternion( camera.quaternion, alpha, beta, gamma, orient );

		}

		this.onMove();

	};

	this.selectCameraType = function ( angle ) {

		var cameraType = this.cameraType;

		// apply hysteresis

		if ( angle > this.thresholdHigh ) {

			cameraType = CAMERA_PERSPECTIVE;

		} else if ( angle < this.thresholdLow ) {

			cameraType = CAMERA_ORTHOGRAPHIC;

		} else if ( cameraType === CAMERA_NONE ) {

			cameraType = CAMERA_ORTHOGRAPHIC;

		}

		if ( cameraType !== this.cameraType ) {

			scope.object = scope.setCamera( cameraType );
			scope.cameraType = cameraType;

			// FIXME - scale to real world sizes adjusted by accuracy
			_box3.setFromCenterAndSize(
				scope.survey.getWorldPosition( scope.position.clone() ),
				new Vector3( 100, 100, 0 )
			);

			scope.cameraMove.prepare( _box3, new Vector3( 0, 0, -1 ) );
			scope.cameraMove.start();

		}

	};

	this.dispose = function () {

		scope.disconnect();

	};

};

export { DeviceOrientationControls };
