
import {
	Object3D,
	Vector3,
	QuadraticBezierCurve3,
	Quaternion,
	Line3,
	Math as _Math
} from '../../../../three.js/src/Three';

function CameraMove ( controls, renderFunction, endCallback ) {

	this.cameraTarget = null;
	this.targetPOI = null;

	this.controls = controls;
	this.renderFunction = renderFunction;
	this.endCallback = endCallback;
	this.frameCount = 0;
	this.frames = 0;
	this.targetZoom = 1;
	this.curve = null;
	this.skipNext = false;

	this.moveRequired = false;
	this.targetRotation = new Quaternion().setFromAxisAngle( Object3D.DefaultUp, 0 );

	this.doAnimate = this.animate.bind( this );

}

CameraMove.prototype.constructor = CameraMove;

CameraMove.prototype.prepare = function () {

	var vMidpoint = new Vector3();
	var cameraLine = new Line3();
	var v = new Vector3();
	var controlPoint = new Vector3();

	return function prepare ( cameraTarget, targetPOI ) {

		if ( this.frameCount !== 0 ) return;

		this.skipNext = false;

		if ( targetPOI && targetPOI.isBox3 ) {

			// target can be a Box3 in world space
			// setup a target position above the box3 such that it fits the screen

			var size = targetPOI.getSize();
			var camera = this.controls.object;
			var elevation;

			targetPOI = targetPOI.getCenter();

			if ( camera.isPerspectiveCamera ) {

				var tan = Math.tan( _Math.DEG2RAD * 0.5 * camera.getEffectiveFOV() );

				var e1 = 1.5 * tan * size.y / 2 + size.z;
				var e2 = tan * camera.aspect * size.x / 2 + size.z;

				elevation = Math.max( e1, e2 );

				this.targetZoom = 1;

				if ( elevation === 0 ) elevation = 100;

			} else {

				var hRatio = ( camera.right - camera.left ) / size.x;
				var vRatio = ( camera.top - camera.bottom ) / size.y;

				this.targetZoom = Math.min( hRatio, vRatio );
				elevation = 600;

			}

			cameraTarget   = targetPOI.clone();
			cameraTarget.z = cameraTarget.z + elevation;

		}

		this.cameraTarget = cameraTarget;
		this.targetPOI = targetPOI;

		this.moveRequired = ( this.cameraTarget !== null || this.targetPOI !== null );

		var startPOI = this.controls.target;
		var cameraStart = this.controls.object.position;

		if ( cameraTarget !== null ) {

			if ( cameraTarget.equals( cameraStart ) ) {

				// start and end camera positions are identical.

				this.moveRequired = false;

				if ( targetPOI === null ) this.skipNext = true;

			} else {

				if ( targetPOI === null ) targetPOI = startPOI;

				// get mid point between start and end POI
				vMidpoint.addVectors( startPOI, targetPOI ).multiplyScalar( 0.5 );

				// line between camera positions
				cameraLine.set( cameraStart, cameraTarget );

				// closest point on line to POI midpoint
				cameraLine.closestPointToPoint( vMidpoint, true, v );

				// reflect mid point around cameraLine in cameraLine + midPoint plane
				controlPoint.subVectors( v, startPOI ).add( v );

				this.curve = new QuadraticBezierCurve3( cameraStart, controlPoint, cameraTarget );

				return this.curve.getPoints( 20 );

			}

		}

	};

}();

CameraMove.prototype.start = function ( time ) {

	var controls = this.controls;

	if ( this.frameCount === 0 && ! this.skipNext ) {

		if ( this.cameraTarget === null && this.targetPOI !== null ) {

			// scale time for simple pans by angle panned through

			var v1 = new Vector3().subVectors( controls.target, controls.object.position );
			var v2 = new Vector3().subVectors( this.targetPOI, controls.object.position );

			time = Math.round( time * Math.acos( v1.normalize().dot( v2.normalize() ) ) / Math.PI );

		}

		this.frameCount = time + 1;
		this.frames = this.frameCount;

		controls.enabled = ! this.moveRequired;

		this.animate();

	}

};

CameraMove.prototype.animate = function () {

	var tRemaining = --this.frameCount;
	var controls = this.controls;
	var curve = this.curve;

	if ( tRemaining < 0 ) {

		this.frameCount = 0;
		this.endAnimation();

		return;

	}

	if ( this.moveRequired ) {

		// update camera position and controls.target

		var camera = controls.object;

		var t =  Math.sin( ( 1 - tRemaining / this.frames ) * Math.PI / 2 );

		if ( curve !== null ) camera.position.copy( this.curve.getPoint( t ) );

		camera.zoom = camera.zoom + ( this.targetZoom - camera.zoom ) * t;

		controls.target.lerp( this.targetPOI, t );

		camera.lookAt( controls.target );

//		var tv = new Vector3().subVectors( camera.position, controls.target );
//		this.targetRotation( tv, 0 );
		if ( curve !== null ) camera.quaternion.slerp( this.targetRotation, t );

		camera.updateProjectionMatrix();
		camera.updateMatrixWorld();

	} else {

		controls.update();

	}

	if ( tRemaining === 0 ) {

		// end of animation

		if ( this.moveRequired ) controls.dispatchEvent( { type: 'change' } );
		this.endAnimation();

		return;

	}

	// send event to update HUD

	controls.dispatchEvent( { type: 'change' } );

	requestAnimationFrame( this.doAnimate );

	this.renderFunction();

};

CameraMove.prototype.endAnimation = function () {

	this.controls.enabled = true;
	this.moveRequired = false;

	this.cameraTarget = null;
	this.targetPOI = null;
	this.curve = null;

	this.renderFunction();
	this.endCallback();

};

CameraMove.prototype.stop = function () {

	this.frameCount = 1;

};

CameraMove.prototype.cancel = function () {

	this.frameCount = 0;
	this.skipNext = false;

};

export { CameraMove };