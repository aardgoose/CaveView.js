
import {
	Object3D,
	Vector3,
	Quaternion,
	Matrix4,
	Math as _Math
} from '../Three';

import { CAMERA_OFFSET } from '../core/constants';

const __v1 = new Vector3();
const __m4 = new Matrix4();

function CameraMove ( controls, renderFunction ) {

	this.cameraTarget = new Vector3();
	this.endPOI = new Vector3();
	this.startQuaternion = new Quaternion();
	this.endQuaternion = new Quaternion();

	this.controls = controls;
	this.renderFunction = renderFunction;
	this.frameCount = 0;
	this.targetZoom = 1;
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

		// apply correction if looking verticaly
		endCamera.add( orientation.multiplyScalar( 0.02 * __v1.z ) );

	}

	// calculate end state rotation of camera

	this.startQuaternion.copy( camera.quaternion ).normalize();

	__m4.lookAt( endCamera, this.endPOI, Object3D.DefaultUp );

	this.endQuaternion.setFromRotationMatrix( __m4 ).normalize();

	this.rotation = 2 * Math.acos( Math.abs( _Math.clamp( this.endQuaternion.dot( this.startQuaternion ), - 1, 1 ) ) );

};

CameraMove.prototype.prepare = function () {

	const targetAxis = new Vector3();
	const orientation = new Vector3();

	return function prepare ( endBox, requiredTargetAxis ) {

		if ( this.running ) return this;

		const camera = this.controls.object;
		const endPOI = this.endPOI;
		const cameraStart = this.controls.object.position;
		const cameraTarget = this.cameraTarget;

		this.skipNext = false;

		// move camera to cardinal axis closest to current camera direction
		// or axis provided by caller

		if ( requiredTargetAxis === undefined ) {

			this.getCardinalAxis( targetAxis );

			if ( targetAxis.z !== 0 ) {

				// set orientation from current orientation, snapping to cardinals

				orientation.set( 0, -1, 0 ); // up = N when looking vertically

			}

		} else {

			targetAxis.copy( requiredTargetAxis );
			orientation.set( 0, -1, 0 ); // up = N when looking vertically

		}

		const fit = CameraMove.fitBox( camera, endBox, targetAxis );

		endBox.getCenter( endPOI );

		this.targetZoom = fit.zoom;

		cameraTarget.copy( endPOI ).add( targetAxis.negate().multiplyScalar( fit.elevation ) );

		// skip move if extremely small

		const cameraOffset = cameraStart.distanceTo( cameraTarget );

		// calculate end state rotation of camera

		this.prepareRotation( cameraTarget, orientation );

		if ( cameraOffset < 0.1 * cameraTarget.z ) {

			// simple rotation of camera, minimal camera position change

			this.animationFunction = this.animateRotate;

			if ( this.rotation < 0.005 ) {

				// minimal camera rotation ( < .5 degree )

				this.skipNext = true;
				this.rotation = 0;

			}

		} else  {

			this.animationFunction = this.animateMove;
			this.rotation = 0;

		}

		return this;

	};

}();

CameraMove.prototype.preparePoint = function ( endPOI ) {

	if ( this.running ) return this;

	const camera = this.controls.object;

	// calculate end state rotation of camera
	this.endPOI.copy( endPOI );

	this.prepareRotation( camera.position );

	// minimal camera rotation or no change of POI
	this.skipNext = ( this.rotation < 0.005 );

	this.animationFunction = this.animateRotate;

	return this;

};

CameraMove.prototype.start = function ( timed ) {

	if ( this.running || this.skipNext ) return;

	const controls = this.controls;

	if ( timed ) {

		if ( this.rotation > 0 ) {

			// scale speed of rotation by angle of rotation

			this.frameCount = Math.round( Math.min( this.rotation / Math.PI * 90 ) );

		} else {

			this.frameCount = 30;

		}

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

CameraMove.prototype.animateRotate = function () {

	// update camera rotation
	const camera = this.controls.object;
	const dt = 1 - ( this.frameCount - 1 ) / this.frameCount;

	camera.quaternion.slerp( this.endQuaternion, dt );

	this.renderFunction();

};

CameraMove.prototype.animateMove = function () {

	// update camera position

	const camera = this.controls.object;
	const target = this.controls.target;
	const dt = 1 - ( this.frameCount - 1 ) / this.frameCount;

	camera.position.lerp( this.cameraTarget, dt);
	camera.zoom = camera.zoom + ( this.targetZoom - camera.zoom ) * dt;
	camera.lookAt( target.lerp( this.endPOI, dt ) );
	camera.quaternion.slerp( this.endQuaternion, dt );

	this.renderFunction();

};


CameraMove.prototype.endAnimation = function () {

	const controls = this.controls;

	controls.target.copy( this.endPOI );

	if ( this.rotation > 0 ) controls.object.position.copy( this.cameraTarget );

	this.running = false;
	this.rotation = 0;

	controls.update();
	controls.enabled = true;

	controls.end();

};

CameraMove.prototype.cancel = function () {

	this.frameCount = 0;
	this.skipNext = false;
	this.running = false;

};

CameraMove.prototype.setAzimuthAngle = function ( targetAngle ) {

	if ( this.running ) return this;

	const controls = this.controls;

	if ( controls.autoRotate || this.frameCount !== 0 ) return;

	var delta = ( controls.getAzimuthalAngle() - targetAngle );
	var deltaSize = Math.abs( delta );

	if ( deltaSize > Math.PI ) delta =  2 * Math.PI - deltaSize;

	this.frameCount = Math.round( Math.abs( delta ) * 90 / Math.PI );

	if ( this.frameCount === 0 ) return;

	this.delta = delta / this.frameCount;

	this.running = true;
	this.animationFunction = this.animateAzimuthMove;

	this.animate();

};

CameraMove.prototype.animateAzimuthMove = function () {

	this.controls.rotateLeft( this.delta );

};

CameraMove.prototype.setPolarAngle = function ( targetAngle ) {

	if ( this.running ) return this;

	const controls = this.controls;

	var delta = ( controls.getPolarAngle() - targetAngle );

	this.frameCount = Math.round( Math.abs( delta * 90 / Math.PI ) );
	this.delta = delta / this.frameCount;

	if ( this.frameCount === 0 ) return;

	this.running = true;
	this.animationFunction = this.animatePolarMove;

	this.animate();

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