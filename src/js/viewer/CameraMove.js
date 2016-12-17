

function CameraMove( controls, renderFunction, endCallback ) {

	this.cameraTarget = null;
	this.targetPOI = null;

	this.controls = controls;
	this.renderFunction = renderFunction;
	this.endCallback = endCallback;
	this.frameCount = 0;
	this.targetZoom = 1;

	this.moveRequired = false;

}

CameraMove.prototype.constructor = CameraMove;

CameraMove.prototype.prepare = function ( cameraTarget, targetPOI ) {

	if ( this.frameCount !== 0 ) return;

	this.cameraTarget = cameraTarget;
	this.targetPOI = targetPOI;

	this.moveRequired = ( this.cameraTarget !== null || this.targetPOI !== null );

}


CameraMove.prototype.start = function( time ) {

	if ( this.frameCount === 0 ) {

		this.frameCount = time + 1;
		this.controls.enabled = ! this.moveRequired;

		this.animate();

	} else {

		// animation already running - just extend time

		// this.frameCount = Math.max( time, this.frameCount );

	}

}

CameraMove.prototype.animate = function () {

	var tRemaining = --this.frameCount;
	var controls = this.controls;

	if ( this.moveRequired ) {

		// update camera position and controls.target

		var camera = controls.object;

		var t = 1 - tRemaining / ( tRemaining + 1 );

		controls.target.lerp( this.targetPOI, t );

		camera.position.lerp( this.cameraTarget, t );

		//	controls.update();
		//	camera.lookAt( activePOIPosition );

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
console.log(( this.frameCount > 0 ) );
	return ( this.frameCount > 0 );

}

export { CameraMove }