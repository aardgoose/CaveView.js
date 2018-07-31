
import {
	Vector3,
	QuadraticBezierCurve3,
	Quaternion,
	Euler,
	Line3,
	Matrix4,
	Math as _Math
} from '../Three';

import { upAxis } from '../core/constants';


function CameraMove ( controls, renderFunction, endCallback ) {

	this.cameraTarget = null;
	this.endPOI = null;
	this.endQuaternion = new Quaternion();

	this.controls = controls;
	this.renderFunction = renderFunction;
	this.endCallback = endCallback;
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


CameraMove.prototype.prepare = function () {

	const vMidpoint = new Vector3();
	const cameraLine = new Line3();
	const vTmp1 = new Vector3();
	const vTmp2 = new Vector3();
	const controlPoint = new Vector3();
	const m4 = new Matrix4();
	const q90 = new Quaternion().setFromAxisAngle( upAxis, - Math.PI / 2 );
	const euler = new Euler();

	return function prepare ( cameraTarget, endPOI ) {

		if ( this.running ) return this;

		const camera = this.controls.object;
		const startPOI = this.controls.target;
		const cameraStart = this.controls.object.position;

		this.skipNext = false;

		if ( endPOI && endPOI.isBox3 ) {

			// target can be a Box3 in world space
			// setup a target position above the box3 such that it fits the screen

			const size = endPOI.getSize( vTmp1 );
			var elevation;

			endPOI = endPOI.getCenter( vTmp2 );

			if ( camera.isPerspectiveCamera ) {

				const tan = Math.tan( _Math.DEG2RAD * 0.5 * camera.getEffectiveFOV() );

				const e1 = 1.5 * tan * size.y / 2 + size.z;
				const e2 = tan * camera.aspect * size.x / 2 + size.z;

				elevation = Math.max( e1, e2 );

				this.targetZoom = 1;

				if ( elevation === 0 ) elevation = 100;

			} else {

				const hRatio = ( camera.right - camera.left ) / size.x;
				const vRatio = ( camera.top - camera.bottom ) / size.y;

				this.targetZoom = Math.min( hRatio, vRatio );
				elevation = 600;

			}

			cameraTarget   = endPOI.clone();
			cameraTarget.z = cameraTarget.z + elevation;

		}

		this.cameraTarget = cameraTarget;
		this.endPOI = endPOI;

		if ( this.cameraTarget !== null || this.endPOI !== null ) {

			m4.lookAt( ( cameraTarget !== null ? cameraTarget : cameraStart ), endPOI, upAxis );

			this.endQuaternion.setFromRotationMatrix( m4 );

			euler.setFromQuaternion( this.endQuaternion );

			if ( Math.abs( euler.x ) < 0.0001 ) {

				// apply correction if looking verticaly
				this.endQuaternion.multiply( q90 );

			}

		}

		if ( cameraTarget !== null ) {

			if ( cameraTarget.equals( cameraStart ) ) {

				// start and end camera positions are identical.

				if ( endPOI === null ) this.skipNext = true;

			} else {

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

				return this;

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
	camera.updateMatrixWorld();

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

	this.endCallback();
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