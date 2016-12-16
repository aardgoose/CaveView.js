

function CameraMove( controls, cameraTarget, targetPOI ) {

	this.cameraTarget = cameraTarget;
	this.targetPOI = targetPOI;

	this.controls = controls;
	this.renderFunction = null;
	this.endCallback = null;
	this.frameCount = 0;
	this.targetZoom = 1;

	this.moveRequired = ( cameraTarget !== null || targetPOI !== null );

}

CameraMove.prototype.constructor = CameraMove;

CameraMove.prototype.start = function( renderFunction, endCallback, time ) {

	if ( this.frameCount === 0 ) {

		this.renderFunction = renderFunction;
		this.endCallback = endCallback;

		this.frameCount = time;
		this.controls.enabled = ! this.moveRequired;

		this.animate();

	} else {

		this.frameCount = Math.max( time, this.frameCount );

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

	} else {

		controls.update();

	}

	if ( tRemaining === 0 ) {

		this.controls.enabled = true;

		if ( this.endCallback ) this.endCallback();

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