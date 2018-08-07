
import {
	Object3D,
	Vector3,
	QuadraticBezierCurve3,
	Quaternion,
	Euler,
	Line3,
	Matrix4,
	Math as _Math
} from '../Three';

import { CAMERA_OFFSET } from '../core/constants';

const vTmp1 = new Vector3();

function CameraMove ( controls, renderFunction ) {

	this.cameraTarget = null;
	this.endPOI = null;
	this.endQuaternion = new Quaternion();

	this.controls = controls;
	this.renderFunction = renderFunction;
	this.frameCount = 0;
	this.frames = 0;
	this.targetZoom = 1;
	this.curve = null;
	this.skipNext = false;

	this.delta = 0;

	this.running = false;
	this.animationFunction = null;

	this.doAnimate = this.animate.bind( this );

}

CameraMove.fitBox = function ( camera, box, viewAxis ) {

	const size = box.getSize( vTmp1 );

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

	this.controls.object.getWorldDirection( vTmp1 );

	const x = Math.abs( vTmp1.x );
	const y = Math.abs( vTmp1.y );
	const z = Math.abs( vTmp1.z );

	if ( x > y && x > z ) {

		targetAxis.set( Math.sign( vTmp1.x ), 0, 0 );

	} else if ( y > z ) {

		targetAxis.set( 0, Math.sign( vTmp1.y ), 0 );

	} else {

		targetAxis.set( 0, 0, Math.sign( vTmp1.z ) );

	}

};

CameraMove.prototype.prepare = function () {

	const vMidpoint = new Vector3();
	const cameraLine = new Line3();
	const vTmp2 = new Vector3();
	const controlPoint = new Vector3();
	const m4 = new Matrix4();
	const q90 = new Quaternion().setFromAxisAngle( Object3D.DefaultUp, - Math.PI / 2 );
	const euler = new Euler();
	const targetAxis = new Vector3();

	return function prepare ( cameraTarget, endPOI, requiredTargetAxis ) {

		if ( this.running ) return this;

		const camera = this.controls.object;
		const startPOI = this.controls.target;
		const cameraStart = this.controls.object.position;

		this.skipNext = false;

		if ( endPOI && endPOI.isBox3 ) {

			// move camera to cardinal axis closest to current camera direction
			// or axis provided by caller

			if ( requiredTargetAxis === undefined ) {

				this.getCardinalAxis( targetAxis );

			} else {

				targetAxis.copy( requiredTargetAxis );

			}

			const fit = CameraMove.fitBox( camera, endPOI, targetAxis );

			endPOI = endPOI.getCenter( vTmp2 );

			this.targetZoom = fit.zoom;

			cameraTarget = endPOI.clone();
			cameraTarget.add( targetAxis.negate().multiplyScalar( fit.elevation ) );

		}

		this.cameraTarget = cameraTarget;
		this.endPOI = endPOI;

		if ( this.cameraTarget !== null || this.endPOI !== null ) {

			// calculate end state rotation of camera

			m4.lookAt( ( cameraTarget !== null ? cameraTarget : cameraStart ), endPOI, Object3D.DefaultUp );

			this.endQuaternion.setFromRotationMatrix( m4 );

			euler.setFromQuaternion( this.endQuaternion );

			if ( Math.abs( euler.x ) < 0.0001 ) {

				// apply correction if looking verticaly
				this.endQuaternion.multiply( q90 );

			}

		}

		// skip move if extremely small

		var cameraOffset = 0;

		if ( cameraTarget !== null ) cameraOffset = cameraStart.distanceTo( cameraTarget );

		var qDiff = 1 - this.endQuaternion.dot( camera.quaternion );

		if ( cameraOffset < 0.1 && qDiff < 0.0000001 ) {

			this.skipNext = true;

			return this;

		}


		if ( cameraTarget !== null ) {

			if ( cameraTarget.equals( cameraStart ) ) {

				if ( endPOI === null ) this.skipNext = true;

			} else {

				// setup curve for camera motion

				if ( endPOI === null ) endPOI = startPOI;

				// get mid point between start and end POI
				vMidpoint.addVectors( startPOI, endPOI ).multiplyScalar( 0.5 );

				// line between camera positions
				cameraLine.set( cameraStart, cameraTarget );

				// closest point on line to POI midpoint
				cameraLine.closestPointToPoint( vMidpoint, true, vTmp1 );

				// reflect mid point around cameraLine in cameraLine + midPoint plane
				controlPoint.subVectors( vTmp1, startPOI ).add( vTmp1 );

				this.curve = new QuadraticBezierCurve3( cameraStart, controlPoint, cameraTarget );

			}

		}

		return this;

	};

}();

CameraMove.prototype.start = function ( time ) {

	if ( this.running || this.skipNext ) return;

	const controls = this.controls;

	if ( this.cameraTarget === null && this.endPOI !== null ) {

		// scale time for simple pans by angle panned through

		const v1 = new Vector3().subVectors( controls.target, controls.object.position );
		const v2 = new Vector3().subVectors( this.endPOI, controls.object.position );

		time = Math.round( time * Math.acos( v1.normalize().dot( v2.normalize() ) ) / Math.PI );

	}

	this.frameCount = time + 1;
	this.frames = this.frameCount;

	controls.enabled = false;

	this.running = true;

	this.animationFunction = this.animateMove;

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

CameraMove.prototype.animateMove = function () {

	const curve = this.curve;

	// update camera position

	const camera = this.controls.object;

	const t = Math.sin( ( 1 - ( this.frameCount - 1 ) / this.frames ) * Math.PI / 2 );

	if ( curve !== null ) camera.position.copy( this.curve.getPoint( t ) );

	camera.zoom = camera.zoom + ( this.targetZoom - camera.zoom ) * t;

	camera.quaternion.slerp( this.endQuaternion, t );

	camera.updateProjectionMatrix();

	this.renderFunction();

};


CameraMove.prototype.endAnimation = function () {

	const controls = this.controls;

	if ( this.endPOI !== null ) controls.target.copy( this.endPOI );

	this.cameraTarget = null;
	this.endPOI = null;
	this.curve = null;
	this.running = false;

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

	if ( this.running ) return;

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

	if ( this.running ) return;

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

	if ( state ) {

		if ( this.running ) return;

		this.controls.autoRotate = true;
		this.running = true;

		this.animate();

	} else {

		this.controls.autoRotate = false;
		this.running = false;

	}

};


export { CameraMove };