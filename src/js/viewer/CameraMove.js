
import {
	Object3D,
	Vector3,
	Quaternion,
	Matrix4,
	Euler,
	Math as _Math
} from '../Three';

import { CAMERA_OFFSET } from '../core/constants';

const __v1 = new Vector3();
const __m4 = new Matrix4();
const __e = new Euler();

function CameraMove ( controls, renderFunction ) {

	this.controls = controls;
	this.renderFunction = renderFunction;

	this.endCameraPosition = new Vector3();
	this.endPOI = new Vector3();
	this.endZoom = 1;
	this.endQuaternion = new Quaternion();

	this.frameCount = 0;
	this.skipNext = false;
	this.rotation = 0;
	this.delta = 0;
	this.running = false;
	this.animationFunction = null;

	this.doAnimate = this.animate.bind( this );

}

CameraMove.fitBox = function ( camera, box, viewAxis ) {

	const size = box.getSize( __v1 );

	var elevation = CAMERA_OFFSET;
	var zoom = 1;

	var dX, dY, dZ;

	if ( viewAxis === undefined || viewAxis.z !== 0 ) {

		dX = size.x;
		dY = size.y;
		dZ = size.z;

	} else if ( viewAxis.x !== 0 ) {

		dX = size.y;
		dY = size.z;
		dZ = size.x;

	} else {

		dX = size.x;
		dY = size.z;
		dZ = size.y;

	}

	if ( camera.isPerspectiveCamera ) {

		const tan2 = 2 * Math.tan( _Math.DEG2RAD * 0.5 * camera.getEffectiveFOV() );

		const e1 = dY / tan2;
		const e2 = ( 1 / camera.aspect ) * dX / tan2;

		elevation = Math.max( e1, e2 ) * 1.1 + dZ / 2;

		if ( elevation === 0 ) elevation = 100;

	} else {

		const hRatio = ( camera.right - camera.left ) / dX;
		const vRatio = ( camera.top - camera.bottom ) / dY;

		zoom = Math.min( hRatio, vRatio ) * 1 / 1.1;

	}

	return { zoom: zoom, elevation: elevation };

};

CameraMove.prototype.getCardinalAxis = function ( targetAxis ) {

	this.controls.object.getWorldDirection( __v1 );

	const x = Math.abs( __v1.x );
	const y = Math.abs( __v1.y );
	const z = Math.abs( __v1.z );

	if ( x > y && x > z ) {

		targetAxis.set( Math.sign( __v1.x ), 0, 0 );

	} else if ( y > z ) {

		targetAxis.set( 0, Math.sign( __v1.y ), 0 );

	} else {

		targetAxis.set( 0, 0, Math.sign( __v1.z ) );

	}

};

CameraMove.prototype.prepareRotation = function ( endCamera, orientation ) {

	const camera = this.controls.object;

	__v1.copy( endCamera ).sub( this.endPOI ).normalize();

	const zDot = __v1.dot( Object3D.DefaultUp );

	if ( Math.abs( zDot ) > 0.99999 && orientation !== undefined ) {

		// apply correction if looking verticaly to set to required cardinal direction for 'up'
		endCamera.add( orientation.multiplyScalar( 0.02 * __v1.z ) );

	}

	// calculate end state rotation of camera

	__m4.lookAt( endCamera, this.endPOI, Object3D.DefaultUp );

	this.endQuaternion.setFromRotationMatrix( __m4 ).normalize();

	// rotation to nearest degree
	this.rotation = Math.round( 2 * Math.acos( Math.abs( _Math.clamp( this.endQuaternion.dot( camera.quaternion ), - 1, 1 ) ) ) * _Math.RAD2DEG );

};

CameraMove.prototype.prepare = function () {

	const targetAxis = new Vector3();
	const orientation = new Vector3();

	return function prepare ( endBox, requiredTargetAxis ) {

		if ( this.running ) return this;

		const camera = this.controls.object;
		const endPOI = this.endPOI;
		const cameraStart = this.controls.object.position;
		const endCameraPosition = this.endCameraPosition;

		this.skipNext = false;

		// move camera to cardinal axis closest to current camera direction
		// or axis provided by caller

		if ( requiredTargetAxis === undefined ) {

			this.getCardinalAxis( targetAxis );

			if ( targetAxis.z !== 0 ) {

				// set orientation from current orientation, snapping to cardinals
				__e.setFromQuaternion( camera.quaternion );

				const direction = Math.round( 2 * ( __e.z + Math.PI ) / Math.PI );

				switch ( direction ) {

				case 0:
				case 4:

					orientation.set( 0, 1, 0 ); // S
					break;

				case 1:

					orientation.set( -1, 0, 0 ); // E
					break;

				case 2:

					orientation.set( 0, -1, 0 ); // N
					break;

				case 3:

					orientation.set( 1, 0, 0 ); // W
					break;

				default:

					orientation.set( 0, -1, 0 ); // up = N when looking vertically

				}

			}

		} else {

			targetAxis.copy( requiredTargetAxis );
			orientation.set( 0, -1, 0 ); // up = N when looking vertically

		}

		const fit = CameraMove.fitBox( camera, endBox, targetAxis );

		endBox.getCenter( endPOI );

		this.endZoom = fit.zoom;

		endCameraPosition.copy( endPOI ).add( targetAxis.negate().multiplyScalar( fit.elevation ) );

		// skip move if extremely small

		const cameraOffset = cameraStart.distanceTo( endCameraPosition );

		// calculate end state rotation of camera

		this.prepareRotation( endCameraPosition, orientation );

		if ( cameraOffset < 0.1 * endCameraPosition.z ) {

			// simple rotation of camera, minimal camera position change

			this.skipNext = ( this.rotation === 0 );

		} else {

			this.rotation = 0;

		}

		this.animationFunction = this.animateMove;

		return this;

	};

}();

CameraMove.prototype.preparePoint = function ( endPOI ) {

	if ( this.running ) return this;

	const camera = this.controls.object;

	// calculate end state rotation of camera
	this.endPOI.copy( endPOI );
	this.endCameraPosition.copy( camera.position );

	this.prepareRotation( camera.position );

	// minimal camera rotation or no change of POI
	this.skipNext = ( this.rotation === 0 );

	this.animationFunction = this.animateMove;

	return this;

};

CameraMove.prototype.start = function ( timed ) {

	if ( this.running || this.skipNext ) return;

	const controls = this.controls;

	if ( timed ) {

		this.frameCount = ( this.rotation > 0 ) ? Math.max( 1, Math.round( this.rotation / 2 ) ) : 30;

	} else {

		this.frameCount = 1;

	}

	controls.enabled = false;

	this.running = true;

	this.animate();

};

CameraMove.prototype.animate = function () {

	const controls = this.controls;

	if ( controls.autoRotate ) {

		controls.update();

	} else if ( this.animationFunction ) {

		this.animationFunction();

		if ( --this.frameCount === 0 ) {

			this.animationFunction = null;
			this.endAnimation();

		}

	}

	if ( this.running ) requestAnimationFrame( this.doAnimate );

};

CameraMove.prototype.endAnimation = function () {

	const controls = this.controls;

	controls.target.copy( this.endPOI );

	if ( this.rotation > 0 ) controls.object.position.copy( this.endCameraPosition );

	this.running = false;
	this.rotation = 0;

	controls.update();
	controls.enabled = true;

	controls.end();

};

CameraMove.prototype.animateMove = function () {

	// update camera position

	const camera = this.controls.object;
	const target = this.controls.target;
	const dt = 1 - ( this.frameCount - 1 ) / this.frameCount;

	if ( ! this.rotation ) {

		camera.position.lerp( this.endCameraPosition, dt);
		camera.zoom = camera.zoom + ( this.endZoom - camera.zoom ) * dt;

		if ( camera.isOrthographicCamera ) camera.updateProjectionMatrix();

		camera.lookAt( target.lerp( this.endPOI, dt ) );

	}

	camera.quaternion.slerp( this.endQuaternion, dt );

	this.renderFunction();

};

CameraMove.prototype.setAngleCommon = function ( delta ) {

	this.frameCount = Math.max( 1, Math.round( Math.abs( delta ) * 90 / Math.PI ) );
	this.delta = delta / this.frameCount;
	this.running = true;

	this.animate();

};

CameraMove.prototype.setAzimuthAngle = function ( targetAngle ) {

	const controls = this.controls;

	if ( this.running || controls.autoRotate ) return this;

	var delta = ( controls.getAzimuthalAngle() - targetAngle );
	var deltaSize = Math.abs( delta );

	if ( deltaSize > Math.PI ) delta = 2 * Math.PI - deltaSize;

	this.animationFunction = this.animateAzimuthMove;

	this.setAngleCommon( delta );

};

CameraMove.prototype.animateAzimuthMove = function () {

	this.controls.rotateLeft( this.delta );

};

CameraMove.prototype.setPolarAngle = function ( targetAngle ) {

	if ( this.running ) return this;

	this.animationFunction = this.animatePolarMove;

	this.setAngleCommon( this.controls.getPolarAngle() - targetAngle );

};

CameraMove.prototype.animatePolarMove = function () {

	this.controls.rotateUp( this.delta );

};

CameraMove.prototype.setAutoRotate = function ( state ) {

	const controls = this.controls;

	if ( state ) {

		if ( this.running ) return;

		controls.autoRotate = true;
		this.running = true;

		this.animate();

	} else {

		if ( controls.autoRotate ) this.running = false;

		controls.autoRotate = false;

	}

};


export { CameraMove };