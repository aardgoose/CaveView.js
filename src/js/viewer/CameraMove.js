
import {
	Vector3, Quaternion, Box3,
	CubicBezierCurve3, Geometry, Line, LineBasicMaterial, LineSegments
} from '../../../../three.js/src/Three.js'; 

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

	this.moveRequired = false;

}

CameraMove.prototype.constructor = CameraMove;

CameraMove.prototype.prepare = function ( cameraTarget, targetPOI ) {

	// FIXME handle non vector3 target

	if ( this.frameCount !== 0 ) return;

	this.cameraTarget = cameraTarget;
	this.targetPOI = targetPOI;

	this.moveRequired = ( this.cameraTarget !== null || this.targetPOI !== null );


	if ( cameraTarget !== null ) {

		var startPOI = this.controls.target;

		if ( targetPOI === null ) targetPOI = startPOI;

		var cameraStart = this.controls.object.position;

		var cp1 = this.getCP( startPOI, cameraStart, cameraTarget );
		var cp2 = this.getCP( targetPOI, cameraTarget, cameraStart );

		this.curve = new CubicBezierCurve3( cameraStart, cp1, cp2, cameraTarget )

	}

}


CameraMove.prototype.getCP = function ( common, p1 , p2 ) {

	var v1 = new Vector3().copy( p1 ).sub( common );
	var v2 = new Vector3().copy( p2 ).sub( common );

	var normal = new Vector3().crossVectors( v1, v2 );

	return new Vector3().crossVectors( normal, v1 ).setLength( v1.length() / 2 ).add( v1 ); 

}

CameraMove.prototype.start = function( time ) {

	if ( this.frameCount === 0 ) {

		this.frameCount = time + 1;
		this.frames = this.frameCount;
		this.controls.enabled = ! this.moveRequired;

		this.animate();

	}

}

CameraMove.prototype.animate = function () {

	var tRemaining = --this.frameCount;
	var controls = this.controls;
	var cameraTarget = this.cameraTarget;
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

		// end of animationt

		this.controls.enabled = true;
		this.moveRequired = false;

		this.cameraTarget = null;
		this.targetPOI = null;

		this.renderFunction();
		this.endCallback();

		return;

	}

	var self = this;

	requestAnimationFrame( function () { self.animate() } );

	this.renderFunction();

}

CameraMove.prototype.stop = function () {

	this.frameCount = 1;

}

CameraMove.prototype.isActive = function () {

	return ( this.frameCount > 0 );

}

export { CameraMove }