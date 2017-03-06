
import {
	Vector3,
	CubicBezierCurve3,
	Math as _Math
} from '../../../../three.js/src/Three'; 

function CameraMove( controls, renderFunction, endCallback ) {

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

}

CameraMove.prototype.constructor = CameraMove;

CameraMove.prototype.prepare = function ( cameraTarget, targetPOI ) {

	if ( this.frameCount !== 0 ) return;

	this.skipNext = false;

	if ( targetPOI && targetPOI.isBox3 ) {

		// target can be a Box3 in world space

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

			var distance = cameraStart.distanceTo( cameraTarget );

			var cp1 = this.getControlPoint( startPOI, cameraStart, cameraTarget, distance );
			var cp2 = this.getControlPoint( targetPOI, cameraTarget, cameraStart, distance );

			this.curve = new CubicBezierCurve3( cameraStart, cp1, cp2, cameraTarget );

		}

	}

};

CameraMove.prototype.getControlPoint = function ( common, p1, p2, distance ) {

	var v1 = new Vector3();
	var v2 = new Vector3();

	var normal = new Vector3();
	var l = 0;

	while ( l === 0 ) {

		v1.copy( p1 ).sub( common );
		v2.copy( p2 ).sub( common );

		normal.crossVectors( v1, v2 );

		l = normal.length();

		if ( l === 0 ) {

			// adjust the targetPOI to avoid degenerate triangles.

			common.addScalar( -1 );

		}

	}

	var adjust = new Vector3().crossVectors( normal, v1 ).setLength( Math.min( distance, v1.length() ) / 3 );

	var candidate1 = new Vector3().copy( adjust ).add( v1 ); 
	var candidate2 = new Vector3().copy( adjust ).negate().add( v1 ); 

	return ( v2.distanceTo( candidate1 ) < v2.distanceTo( candidate2 ) ) ? candidate1 : candidate2;

};

CameraMove.prototype.start = function ( time ) {

	if ( this.frameCount === 0 && ! this.skipNext ) {

		this.frameCount = time + 1;
		this.frames = this.frameCount;
		this.controls.enabled = ! this.moveRequired;

		this.animate();

	}

};

CameraMove.prototype.animate = function () {

	var tRemaining = --this.frameCount;
	var controls = this.controls;
	var curve = this.curve;

	if ( this.moveRequired ) {

		// update camera position and controls.target

		var camera = controls.object;

		var t = 1 - tRemaining / this.frames;

		controls.target.lerp( this.targetPOI, t );

		if ( curve !== null ) {

			camera.position.copy( this.curve.getPoint( t ) );

		}

		camera.zoom = camera.zoom + ( this.targetZoom - camera.zoom ) * t;

		//	if ( targetPOI.quaternion ) camera.quaternion.slerp( targetPOI.quaternion, t );

		camera.updateProjectionMatrix();

	}

	controls.update();

	if ( tRemaining === 0 ) {

		// end of animation

		this.endAnimation();

		return;

	}

	var self = this;

	requestAnimationFrame( function () { self.animate(); } );

	this.renderFunction();

};

CameraMove.prototype.endAnimation = function () {

	this.controls.enabled = true;
	this.moveRequired = false;
	
	this.cameraTarget = null;
	this.targetPOI = null;

	this.renderFunction();
	this.endCallback();

};

CameraMove.prototype.stop = function () {

	this.frameCount = 1;

};

CameraMove.prototype.isActive = function () {

	return ( this.frameCount > 0 );

};

export { CameraMove };