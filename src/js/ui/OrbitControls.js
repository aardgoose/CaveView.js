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
	EventDispatcher, MathUtils
} from '../Three';

const MODE_LOCK_UNLOCKED = 0;
const MODE_LOCK_ROTATE = 1;
const MODE_LOCK_ZOOM = 2;
const SVX_DELTA = Math.PI / 60;

const __v = new Vector3();

class OrbitControls extends EventDispatcher {

	constructor ( cameraManager, domElement, viewer ) {

		super();

		this.cameraManager = cameraManager;

		const element = domElement;

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
		this.zoomToCursor = false;

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

		// mouse wheel mode
		this.wheelTilt = false;

		// for reset

		const camera = cameraManager.activeCamera;

		this.target0 = this.target.clone();
		this.position0 = camera.position.clone();
		this.zoom0 = camera.zoom;

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

		this.scaleDolly = function ( scaleFactor ) {

			scale *= scaleFactor;
			this.update();

		};

		this.saveState = function () {

			const camera = cameraManager.activeCamera;

			scope.target0.copy( scope.target );
			scope.position0.copy( camera.position );
			scope.zoom0 = camera.zoom;

		};

		this.reset = function () {

			const camera = cameraManager.activeCamera;

			scope.target.copy( scope.target0 );
			camera.position.copy( scope.position0 );
			camera.zoom = scope.zoom0;

			camera.updateProjectionMatrix();
			scope.dispatchEvent( changeEvent );

			scope.update();

			state = STATE.NONE;

		};

		// this method is exposed, but perhaps it would be better if we can make it private...
		this.update = function () {

			const offset = new Vector3();
			const up = cameraManager.activeCamera.up;

			// so camera.up is the orbit axis
			const quat = new Quaternion().setFromUnitVectors( up, new Vector3( 0, 1, 0 ) );
			const quatInverse = quat.clone().invert();

			const lastPosition = new Vector3();
			const lastQuaternion = new Quaternion();

			return function update() {

				const camera = cameraManager.activeCamera;
				const target = scope.target;
				const position = camera.position;

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
				spherical.theta = MathUtils.clamp( spherical.theta, scope.minAzimuthAngle, scope.maxAzimuthAngle );

				// restrict phi to be between desired limits
				spherical.phi = MathUtils.clamp( spherical.phi, scope.minPolarAngle, scope.maxPolarAngle );

				spherical.makeSafe();

				const prevRadius = Math.max( spherical.radius, EPS );
				spherical.radius *= scale;

				// restrict radius to be between desired limits
				spherical.radius = MathUtils.clamp( spherical.radius, scope.minDistance, scope.maxDistance );

				// move target to panned location
				target.add( panOffset );

				// suport zoomToCursor (mouse only)

				if ( scope.zoomToCursor ) {

					if ( camera.isPerspectiveCamera ) {

						target.lerp( mouse3D, 1 - spherical.radius / prevRadius );

					} else if ( camera.isOrthographicCamera ) {

						target.lerp( mouse3D, 1 - zoomFactor );

					}

				}

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
					zoomFactor = 1;

					return true;

				}

				return false;

			};

		}();

		this.dispose = function () {

			element.removeEventListener( 'contextmenu', onContextMenu, false );
			element.removeEventListener( 'mousedown', onMouseDown, false );
			element.removeEventListener( 'wheel', onMouseWheel, false );

			element.removeEventListener( 'touchstart', onTouchStart, false );
			element.removeEventListener( 'touchend', onTouchEnd, false );
			element.removeEventListener( 'touchmove', onTouchMove, false );

			document.removeEventListener( 'mousemove', onMouseMove, false );
			document.removeEventListener( 'mouseup', onMouseUp, false );

			element.removeEventListener( 'keydown', onKeyDown, false );

		};

		this.end = function () {

			scope.dispatchEvent( endEvent );

		};

		Object.defineProperty( this, 'svxControlMode', {
			set: setControlMode,
			get: function () { return svxControlMode; }

		} );

		//
		// internals
		//

		const scope = this;

		const changeEvent = { type: 'change' };
		const startEvent = { type: 'start' };
		const endEvent = { type: 'end' };

		const LEFT_BUTTON = 1;
		const RIGHT_BUTTON = 2;
		const MIDDLE_BUTTON = 4;
		const EMULATED_MIDDLE_BUTTON = 3;

		let buttons = 0;
		let lastButtonDownTime = 0;

		const STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY_PAN: 4 };

		let state = STATE.NONE;

		const EPS = 0.000001;

		// current position in spherical coordinates
		const spherical = new Spherical();
		const sphericalDelta = new Spherical();

		let scale = 1;
		const panOffset = new Vector3();
		let zoomChanged = false;
		let zoomFactor = 1;

		const rotateStart = new Vector2();
		const rotateEnd = new Vector2();
		const rotateDelta = new Vector2();

		const panStart = new Vector2();
		const panEnd = new Vector2();
		const panDelta = new Vector2();

		const dollyStart = new Vector2();
		const dollyEnd = new Vector2();
		const dollyDelta = new Vector2();

		const mouse3D = new Vector3();
		const mouseStart = new Vector3();

		let firstWheelMove = true;

		const svxStart = new Vector2();
		const svxEnd = new Vector2();
		const svxDelta = new Vector2();

		let modeLock = MODE_LOCK_UNLOCKED;
		let lastMoveTime = 0;
		let svxReverseSense = -1;

		let svxControlMode  = false;

		// mode specific handlers

		let handleMouseDownLeft;
		let handleMouseDownMiddle;
		let handleMouseMoveLeft;
		let handleMouseMoveMiddle;


		function setControlMode ( svxMode ) {

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

			svxControlMode = svxMode;

		}

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

		const panLeft = function ( distance, objectMatrix ) {

			distance *= svxReverseSense;

			__v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
			__v.multiplyScalar( distance );

			panOffset.add( __v );

		};


		const panUp = function ( distance, objectMatrix ) {

			distance *= svxReverseSense;

			__v.setFromMatrixColumn( objectMatrix, 1 );
			__v.multiplyScalar( - distance );

			panOffset.add( __v );

		};

		// deltaX and deltaY are in pixels; right and down are positive
		const pan = function ( deltaX, deltaY ) {

			const camera = cameraManager.activeCamera;

			if ( camera.isPerspectiveCamera ) {

				// perspective
				__v.copy( camera.position ).sub( scope.target );

				let targetDistance = __v.length();

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

			const camera = cameraManager.activeCamera;

			if ( camera.isPerspectiveCamera ) {

				scale /= dollyScale;

			} else if ( camera.isOrthographicCamera ) {

				zoomFactor = camera.zoom;
				camera.zoom = MathUtils.clamp( camera.zoom * dollyScale, scope.minZoom, scope.maxZoom );
				zoomFactor /= camera.zoom;
				camera.updateProjectionMatrix();
				zoomChanged = true;

			}

		}

		function dollyOut( dollyScale ) {

			const camera = cameraManager.activeCamera;

			if ( camera.isPerspectiveCamera ) {

				scale *= dollyScale;

			} else if ( camera.isOrthographicCamera ) {

				zoomFactor = camera.zoom;
				camera.zoom = MathUtils.clamp( camera.zoom / dollyScale, scope.minZoom, scope.maxZoom );
				zoomFactor /= camera.zoom;
				camera.updateProjectionMatrix();
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
			rotateLeft( 2 * Math.PI * svxDelta.x * svxReverseSense / element.clientWidth );
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

			switch ( modeLock ) {

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
			rotateUp( 2 * Math.PI * rotateDelta.y * svxReverseSense / element.clientHeight );

			rotateStart.copy( rotateEnd );

			scope.update();

		}

		function handleMouseMoveRotate( event ) {

			rotateEnd.set( event.clientX, event.clientY );

			rotateDelta.subVectors( rotateEnd, rotateStart );

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

			updateMouse3D( event.clientX, event.clientY );

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

		const updateMouse3D = function () {

			const v = new Vector3();
			const v1 = new Vector3();
			const up = new Vector3();

			return function updateMouse3D( x, y ) {

				const camera = cameraManager.activeCamera;
				camera.getWorldDirection( up );

				let distance;

				// get mouse in ndc
				const mouse = cameraManager.getMouse( x, y );

				if ( firstWheelMove || mouseStart.x !== mouse.x || mouseStart.y !== mouse.y ) {

					const station = viewer.getStation( mouse );

					if ( station !== null ) station.project( camera );

					mouseStart.set( mouse.x, mouse.y, station === null ? 0.5 : station.z );
					firstWheelMove = false;

				}

				if ( camera.isPerspectiveCamera ) {

					v.set( mouse.x, mouse.y, mouseStart.z ).unproject( camera );
					v.sub( camera.position ).normalize();

					v1.copy( scope.target ).sub( camera.position );

					distance = v1.dot( up ) / v.dot( up );

					mouse3D.copy( camera.position ).add( v.multiplyScalar( distance ) );

				} else if ( camera.isOrthographicCamera ) {

					v.set( mouse.x, mouse.y, ( camera.near + camera.far ) / ( camera.near - camera.far ) );

					v.unproject( camera );

					v1.set( 0, 0, - 1 ).applyQuaternion( camera.quaternion );

					distance = - v.dot( up ) / v1.dot( up );

					mouse3D.copy( v ).add( v1.multiplyScalar( distance ) );

				}

			};

		}();

		function handleMouseWheel( event ) {

			const deltaY = event.deltaY;

			if ( scope.wheelTilt ) {

				// rotating up and down along whole screen attempts to go 360, but limited to 180
				rotateUp( 2 * Math.PI * deltaY / 12500 );

			} else {

				updateMouse3D( event.clientX, event.clientY );

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

				if ( ! svxControlMode ) break;

				rotateLeft( - SVX_DELTA );
				scope.update();
				break;

			case 82: // 'R'

				if ( ! svxControlMode || ! event.ctrlKey ) break;
				event.preventDefault();
				svxReverseSense *= -1;
				break;

			case 86: // 'V'

				if ( ! svxControlMode ) break;
				rotateLeft( SVX_DELTA );
				scope.update();
				break;

			case 191: // '/

				if ( ! svxControlMode ) break;
				rotateUp( -SVX_DELTA );
				scope.update();
				break;

			case 192: // '''

				if ( ! svxControlMode ) break;
				rotateUp( SVX_DELTA );
				scope.update();
				break;

			case 219: // '['

				if ( ! svxControlMode ) break;
				dollyOut( getZoomScale() );
				scope.update();
				break;

			case 221: // ']'

				if ( ! svxControlMode ) break;
				dollyIn( getZoomScale() );
				scope.update();
				break;

			}

		}

		function handleTouchStartRotate( event ) {

			rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		}

		function handleTouchStartDollyPan( event ) {

			const dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			const dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

			const distance = Math.sqrt( dx * dx + dy * dy );

			dollyStart.set( 0, distance );

			const x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			const y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			updateMouse3D( x, y );

			panStart.set( x, y );

		}

		function handleTouchMoveRotate( event ) {

			rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

			rotateDelta.subVectors( rotateEnd, rotateStart );

			// rotating across whole screen goes 360 degrees around
			rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth );

			// rotating up and down along whole screen attempts to go 360, but limited to 180
			rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

			rotateStart.copy( rotateEnd );

			scope.update();

		}

		function handleTouchMoveDollyPan( event ) {

			const dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			const dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

			const distance = Math.sqrt( dx * dx + dy * dy );

			dollyEnd.set( 0, distance );

			dollyDelta.set( 0, Math.pow( dollyEnd.y / dollyStart.y, scope.zoomSpeed ) );

			dollyIn( dollyDelta.y );

			dollyStart.copy( dollyEnd );

			const x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			const y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			updateMouse3D( x, y );

			panEnd.set( x, y );

			panDelta.subVectors( panEnd, panStart );

			pan( panDelta.x, panDelta.y );

			panStart.copy( panEnd );

			scope.update();

		}

		function setButtons( button ) {

			// add to current buttons depressed set
			// allows emulation of 3rd button in absence of event.buttons

			let newButtons = 0;

			switch ( button ) {

			case MOUSE.LEFT:

				newButtons = LEFT_BUTTON;
				break;

			case MOUSE.MIDDLE:

				newButtons = MIDDLE_BUTTON;
				break;

			case MOUSE.RIGHT:

				newButtons = RIGHT_BUTTON;
				break;

			}

			const now = performance.now();

			if ( now - lastButtonDownTime < 100 ) {

				buttons |= newButtons;

			} else {

				buttons = newButtons;

			}

			lastButtonDownTime = now;

		}

		//
		// event handlers - FSM: listen for events and reset state
		//

		function onMouseDown( event ) {

			if ( scope.enabled === false ) return;
			event.preventDefault();

			setButtons( event.button );

			switch ( buttons ) {

			case LEFT_BUTTON:

				handleMouseDownLeft( event );

				state = STATE.ROTATE;

				break;

			case MIDDLE_BUTTON:
			case EMULATED_MIDDLE_BUTTON:

				handleMouseDownMiddle( event );

				state = STATE.DOLLY;

				break;

			case RIGHT_BUTTON:

				handleMouseDownPan( event );

				element.style.cursor = 'all-scroll';

				state = STATE.PAN;

				break;

			}

			if ( state !== STATE.NONE ) {

				document.addEventListener( 'mousemove', onMouseMove, false );
				document.addEventListener( 'mouseup', onMouseUp, false );

				scope.dispatchEvent( startEvent );

			}

			firstWheelMove = true;

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

			firstWheelMove = true;

		}

		function onMouseUp( /* event */ ) {

			if ( scope.enabled === false ) return;

			element.style.cursor = 'default';

			document.removeEventListener( 'mousemove', onMouseMove, false );
			document.removeEventListener( 'mouseup', onMouseUp, false );

			scope.dispatchEvent( endEvent );

			state = STATE.NONE;
			buttons = 0;

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

			event.preventDefault();

			if ( scope.enabled === false || scope.enableKeys === false ) return;
			if ( ! viewer.mouseOver ) return;

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

			scope.dispatchEvent( endEvent );

			state = STATE.NONE;

		}

		function onContextMenu( event ) {

			if ( scope.enabled === false ) return;

			event.preventDefault();

		}

		//

		element.addEventListener( 'contextmenu', onContextMenu, false );

		element.addEventListener( 'mousedown', onMouseDown, false );
		element.addEventListener( 'wheel', onMouseWheel, false );

		element.addEventListener( 'touchstart', onTouchStart, false );
		element.addEventListener( 'touchend', onTouchEnd, false );
		element.addEventListener( 'touchmove', onTouchMove, false );

		element.addEventListener( 'keydown', onKeyDown, false );

		const cfg = viewer.ctx.cfg;

		setControlMode( cfg.value( 'avenControls', true ) );

		// force an update at start

		this.update();

	}

}

export { OrbitControls };