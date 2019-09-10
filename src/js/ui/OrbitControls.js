/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or arrow keys / touch: two-finger move
import {
	Vector2, Vector3, Quaternion, Spherical,
	MOUSE,
	EventDispatcher
} from '../Three';

const MODE_LOCK_UNLOCKED = 0;
const MODE_LOCK_ROTATE = 1;
const MODE_LOCK_ZOOM = 2;
const SVX_DELTA = Math.PI / 60;

const __v = new Vector3();

function OrbitControls ( object, domElement, svxMode ) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;
	this.element = this.domElement === document ? this.domElement.body : this.domElement;

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the object orbits around
	this.target = new Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	this.minZoom = 0;
	this.maxZoom = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	this.zoomSpeed = 1.0;

	// Set to false to disable panning
	this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	// If auto-rotate is enabled, you must call controls.update() in your animation loop
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// Set to false to disable use of the keys
	this.enableKeys = true;

	// The four arrow keys
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	// Mouse buttons
	this.mouseButtons = { ORBIT: MOUSE.LEFT, ZOOM: MOUSE.MIDDLE, PAN: MOUSE.RIGHT };

	// mouse wheel mode
	this.wheelTilt = false;

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.zoom0 = this.object.zoom;

	//
	// public methods
	//

	this.getPolarAngle = function () {

		return spherical.phi;

	};

	this.getAzimuthalAngle = function () {

		return spherical.theta;

	};

	this.rotateUp = function ( angle ) {

		rotateUp( angle );
		this.update();

	};

	this.rotateLeft = function ( angle ) {

		rotateLeft( angle );
		this.update();

	};

	this.saveState = function () {

		scope.target0.copy( scope.target );
		scope.position0.copy( scope.object.position );
		scope.zoom0 = scope.object.zoom;

	};

	this.reset = function () {

		scope.target.copy( scope.target0 );
		scope.object.position.copy( scope.position0 );
		scope.object.zoom = scope.zoom0;

		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );

		scope.update();

		state = STATE.NONE;

	};

	// this method is exposed, but perhaps it would be better if we can make it private...
	this.update = function () {

		var offset = new Vector3();

		// so camera.up is the orbit axis
		var quat = new Quaternion().setFromUnitVectors( object.up, new Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().inverse();

		var lastPosition = new Vector3();
		var lastQuaternion = new Quaternion();

		return function update() {

			var camera = scope.object;
			var target = scope.target;
			var position = camera.position;

			offset.copy( position ).sub( target );

			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion( quat );

			// angle from z-axis around y-axis
			spherical.setFromVector3( offset );

			if ( scope.autoRotate && state === STATE.NONE ) {

				rotateLeft( getAutoRotationAngle() );

			}

			spherical.theta += sphericalDelta.theta;
			spherical.phi += sphericalDelta.phi;

			// restrict theta to be between desired limits
			spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

			// restrict phi to be between desired limits
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

			spherical.makeSafe();

			spherical.radius *= scale;

			// restrict radius to be between desired limits
			spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

			// move target to panned location
			target.add( panOffset );

			offset.setFromSpherical( spherical );

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion( quatInverse );

			position.copy( target ).add( offset );

			camera.lookAt( target );

			sphericalDelta.set( 0, 0, 0 );
			panOffset.set( 0, 0, 0 );

			scale = 1;

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8

			if ( zoomChanged ||
				lastPosition.distanceToSquared( position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( camera.quaternion ) ) > EPS ) {

				scope.dispatchEvent( changeEvent );

				lastPosition.copy( position );
				lastQuaternion.copy( camera.quaternion );
				zoomChanged = false;

				return true;

			}

			return false;

		};

	}();

	this.dispose = function () {

		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );

		scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		window.removeEventListener( 'keydown', onKeyDown, false );

	};

	this.end = function () {

		scope.dispatchEvent( endEvent );

	};

	//
	// internals
	//

	var scope = this;

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };

	var STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY_PAN: 4 };

	var state = STATE.NONE;

	var EPS = 0.000001;

	// current position in spherical coordinates
	var spherical = new Spherical();
	var sphericalDelta = new Spherical();

	var scale = 1;
	var panOffset = new Vector3();
	var zoomChanged = false;

	var rotateStart = new Vector2();
	var rotateEnd = new Vector2();
	var rotateDelta = new Vector2();

	var panStart = new Vector2();
	var panEnd = new Vector2();
	var panDelta = new Vector2();

	var dollyStart = new Vector2();
	var dollyEnd = new Vector2();
	var dollyDelta = new Vector2();

	var svxStart = new Vector2();
	var svxEnd = new Vector2();
	var svxDelta = new Vector2();

	var modeLock = MODE_LOCK_UNLOCKED;
	var lastMoveTime = 0;
	var svxReverseSense = -1;

	// mode specific handlers

	var handleMouseDownLeft;
	var handleMouseDownMiddle;
	var handleMouseMoveLeft;
	var handleMouseMoveMiddle;


	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function rotateLeft( angle ) {

		sphericalDelta.theta -= angle;

	}

	function rotateUp( angle ) {

		sphericalDelta.phi -= angle;

	}

	var panLeft = function ( distance, objectMatrix ) {

		distance *= svxReverseSense;

		__v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
		__v.multiplyScalar( distance );

		panOffset.add( __v );

	};


	var panUp = function ( distance, objectMatrix ) {

		distance *= svxReverseSense;

		__v.setFromMatrixColumn( objectMatrix, 1 );
		__v.multiplyScalar( - distance );

		panOffset.add( __v );

	};

	// deltaX and deltaY are in pixels; right and down are positive
	var pan = function ( deltaX, deltaY ) {

		var element = scope.element;
		var camera = scope.object;

		if ( camera.isPerspectiveCamera ) {

			// perspective
			var position = camera.position;
			__v.copy( position ).sub( scope.target );

			var targetDistance = __v.length();

			// half of the fov is center to top of screen
			targetDistance *= Math.tan( ( camera.fov / 2 ) * Math.PI / 180.0 );

			// we use only clientHeight here so aspect ratio does not distort speed
			panLeft( 2 * deltaX * targetDistance / element.clientHeight, camera.matrix );
			panUp( 2 * deltaY * targetDistance / element.clientHeight, camera.matrix );

		} else if ( camera.isOrthographicCamera ) {

			// orthographic
			panLeft( deltaX * ( camera.right - camera.left ) / ( camera.zoom * element.clientWidth ), camera.matrix );
			panUp( deltaY * ( camera.top - camera.bottom ) / ( camera.zoom * element.clientHeight ), camera.matrix );

		}

	};

	function dollyIn( dollyScale ) {

		if ( scope.object.isPerspectiveCamera ) {

			scale /= dollyScale;

		} else if ( scope.object.isOrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		}

	}

	function dollyOut( dollyScale ) {

		if ( scope.object.isPerspectiveCamera ) {

			scale *= dollyScale;

		} else if ( scope.object.isOrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		}

	}

	//
	// event callbacks - update the object state
	//

	function handleMouseDownSvx( event ) {

		svxStart.set( event.clientX, event.clientY );

		modeLock = MODE_LOCK_UNLOCKED;

	}

	function handleMouseDownRotate( event ) {

		rotateStart.set( event.clientX, event.clientY );

	}


	function handleMouseDownDolly( event ) {

		dollyStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownPan( event ) {

		panStart.set( event.clientX, event.clientY );

	}

	function rotateSvx() {

		rotateStart.copy( svxStart );
		rotateLeft( 2 * Math.PI * svxDelta.x * svxReverseSense / scope.element.clientWidth );
		rotateStart.copy( svxEnd );

		scope.update();

	}

	function zoomSvx( event ) {

		dollyStart.copy( svxStart );
		handleMouseMoveDolly( event, svxReverseSense );

	}

	function handleMouseMoveSvxLeft( event ) {

		svxEnd.set( event.clientX, event.clientY );

		svxDelta.subVectors( svxEnd, svxStart );

		const now = performance.now();

		if ( now > lastMoveTime + 1000 ) modeLock = MODE_LOCK_UNLOCKED;

		lastMoveTime = now;

		const deltaX2 = svxDelta.x * svxDelta.x;
		const deltaY2 = svxDelta.y * svxDelta.y;

		switch( modeLock ) {

		case MODE_LOCK_UNLOCKED:

			if ( Math.abs( svxDelta.x ) > Math.abs( svxDelta.y ) ) {

				modeLock = MODE_LOCK_ROTATE;

			} else {

				modeLock = MODE_LOCK_ZOOM;

			}

			break;

		case MODE_LOCK_ROTATE:

			if ( deltaY2 > 8 * deltaX2 ) modeLock = MODE_LOCK_ZOOM;

			break;

		case MODE_LOCK_ZOOM:

			if ( deltaX2 > 8 * deltaY2 ) modeLock = MODE_LOCK_ROTATE;

			break;

		}

		if ( modeLock === MODE_LOCK_ROTATE ) {

			rotateSvx();

		} else {

			zoomSvx( event );

		}

		svxStart.copy( svxEnd );

	}

	function handleMouseMoveSvxMiddle( event ) {

		rotateEnd.set( event.clientX, event.clientY );

		rotateDelta.subVectors( rotateEnd, rotateStart );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y * svxReverseSense / scope.element.clientHeight );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleMouseMoveRotate( event ) {

		rotateEnd.set( event.clientX, event.clientY );

		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.element;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleMouseMoveDolly( event, sense ) {

		dollyEnd.set( event.clientX, event.clientY );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		dollyDelta.y *= sense;

		if ( dollyDelta.y > 0 ) {

			dollyIn( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyOut( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleMouseMovePan( event ) {

		panEnd.set( event.clientX, event.clientY );

		panDelta.subVectors( panEnd, panStart );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleMouseWheel( event ) {

		const deltaY = event.deltaY;

		if ( scope.wheelTilt ) {

			// rotating up and down along whole screen attempts to go 360, but limited to 180
			rotateUp( 2 * Math.PI * deltaY / 12500 );

		} else {

			if ( deltaY < 0 ) {

				dollyOut( getZoomScale() );

			} else if ( deltaY > 0 ) {

				dollyIn( getZoomScale() );

			}

		}

		scope.update();

	}

	function handleKeyDown( event ) {

		switch ( event.keyCode ) {

		case scope.keys.UP:
			pan( 0, scope.keyPanSpeed );
			scope.update();
			break;

		case scope.keys.BOTTOM:
			pan( 0, - scope.keyPanSpeed );
			scope.update();
			break;

		case scope.keys.LEFT:
			pan( scope.keyPanSpeed, 0 );
			scope.update();
			break;

		case scope.keys.RIGHT:
			pan( - scope.keyPanSpeed, 0 );
			scope.update();
			break;

		case 67: // 'C'

			if ( ! svxMode ) break;

			rotateLeft( - SVX_DELTA );
			scope.update();
			break;

		case 82: // 'R'

			if ( ! svxMode || ! event.ctrlKey ) break;
			event.preventDefault();
			svxReverseSense *= -1;
			break;

		case 86: // 'V'

			if ( ! svxMode ) break;
			rotateLeft( SVX_DELTA );
			scope.update();
			break;

		case 191: // '/

			if ( ! svxMode ) break;
			rotateUp( -SVX_DELTA );
			scope.update();
			break;

		case 192: // '''

			if ( ! svxMode ) break;
			rotateUp( SVX_DELTA );
			scope.update();
			break;

		case 219: // '['

			if ( ! svxMode ) break;
			dollyOut( getZoomScale() );
			scope.update();
			break;

		case 221: // ']'

			if ( ! svxMode ) break;
			dollyIn( getZoomScale() );
			scope.update();
			break;

		}

	}

	function handleTouchStartRotate( event ) {

		rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	}

	function handleTouchStartDollyPan( event ) {

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyStart.set( 0, distance );

		var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
		var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

		panStart.set( x, y );

	}

	function handleTouchMoveRotate( event ) {

		rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.element;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleTouchMoveDollyPan( event ) {

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyEnd.set( 0, distance );

		dollyDelta.set( 0, Math.pow( dollyEnd.y / dollyStart.y, scope.zoomSpeed ) );

		dollyIn( dollyDelta.y );

		dollyStart.copy( dollyEnd );


		var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
		var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

		panEnd.set( x, y );

		panDelta.subVectors( panEnd, panStart );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	//
	// event handlers - FSM: listen for events and reset state
	//

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;
		event.preventDefault();

		switch ( event.button ) {

		case scope.mouseButtons.ORBIT:

			handleMouseDownLeft( event );

			state = STATE.ROTATE;

			break;

		case scope.mouseButtons.ZOOM:

			handleMouseDownMiddle( event );

			state = STATE.DOLLY;

			break;

		case scope.mouseButtons.PAN:

			handleMouseDownPan( event );

			scope.element.style.cursor = 'all-scroll';

			state = STATE.PAN;

			break;

		}

		if ( state !== STATE.NONE ) {

			document.addEventListener( 'mousemove', onMouseMove, false );
			document.addEventListener( 'mouseup', onMouseUp, false );

			scope.dispatchEvent( startEvent );

		}

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		switch ( state ) {

		case STATE.ROTATE:

			handleMouseMoveLeft( event );

			break;

		case STATE.DOLLY:

			handleMouseMoveMiddle( event, 1 );

			break;

		case STATE.PAN:

			handleMouseMovePan( event );

			break;

		}

	}

	function onMouseUp( /* event */ ) {

		if ( scope.enabled === false ) return;

		//handleMouseUp( event );
		scope.element.style.cursor = 'default';

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;

		event.preventDefault();
		event.stopPropagation();

		scope.dispatchEvent( startEvent );

		handleMouseWheel( event );

		scope.dispatchEvent( endEvent );

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false || scope.enableKeys === false ) return;

		handleKeyDown( event );

	}

	function onTouchStart( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		switch ( event.touches.length ) {

		case 1:	// one-fingered touch: rotate

			handleTouchStartRotate( event );

			state = STATE.TOUCH_ROTATE;

			break;

		case 2:	// two-fingered touch: dolly-pan

			handleTouchStartDollyPan( event );

			state = STATE.TOUCH_DOLLY_PAN;

			break;

		default:

			state = STATE.NONE;

		}

		if ( state !== STATE.NONE ) {

			scope.dispatchEvent( startEvent );

		}

	}

	function onTouchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

		case 1: // one-fingered touch: rotate

			if ( state !== STATE.TOUCH_ROTATE ) return; // is this needed?

			handleTouchMoveRotate( event );

			break;

		case 2: // two-fingered touch: dolly-pan

			if ( state !== STATE.TOUCH_DOLLY_PAN ) return; // is this needed?

			handleTouchMoveDollyPan( event );

			break;

		default:

			state = STATE.NONE;

		}

	}

	function onTouchEnd( /* event */ ) {

		if ( scope.enabled === false ) return;

		//handleTouchEnd( event );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onContextMenu( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

	}

	//

	scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );

	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	scope.domElement.addEventListener( 'wheel', onMouseWheel, false );

	scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
	scope.domElement.addEventListener( 'touchend', onTouchEnd, false );
	scope.domElement.addEventListener( 'touchmove', onTouchMove, false );

	window.addEventListener( 'keydown', onKeyDown, false );

	if ( svxMode ) {

		handleMouseDownLeft = handleMouseDownSvx;
		handleMouseDownMiddle = handleMouseDownRotate;
		handleMouseMoveLeft = handleMouseMoveSvxLeft;
		handleMouseMoveMiddle = handleMouseMoveSvxMiddle;

	} else {

		handleMouseDownLeft = handleMouseDownRotate;
		handleMouseDownMiddle = handleMouseDownDolly;
		handleMouseMoveLeft = handleMouseMoveRotate;
		handleMouseMoveMiddle = handleMouseMoveDolly;

	}

	// force an update at start

	this.update();

}

OrbitControls.prototype = Object.create( EventDispatcher.prototype );
OrbitControls.prototype.constructor = OrbitControls;

export { OrbitControls };
