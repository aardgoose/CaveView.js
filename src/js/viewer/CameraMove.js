import { Euler, MathUtils, Matrix4, Object3D, Quaternion, Vector3 } from '../Three';
import { CAMERA_OFFSET } from '../core/constants';

const __v1 = new Vector3();
const __v2 = new Vector3();
const __v3 = new Vector3();
const __m4 = new Matrix4();
const __e = new Euler();

class CameraMove {

	constructor ( controls, renderFunction ) {

		const endCameraPosition = new Vector3();
		const endPOI = new Vector3();
		const endQuaternion = new Quaternion();
		const cameraManager = controls.cameraManager;

		let endZoom = 1;
		let frameCount = 0;
		let skipNext = false;
		let rotation = 0;
		let delta = 0;
		let running = false;
		let animationFunction = null;
		let rafID = 0;

		function getCardinalAxis ( targetAxis ) {

			cameraManager.activeCamera.getWorldDirection( __v1 );

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

		}

		function prepareRotation ( endCamera, orientation ) {

			const camera = cameraManager.activeCamera;

			__v1.copy( endCamera ).sub( endPOI ).normalize();

			const zDot = __v1.dot( Object3D.DefaultUp );

			if ( Math.abs( zDot ) > 0.99999 && orientation !== undefined ) {

				// apply correction if looking verticaly to set to required cardinal direction for 'up'
				endCamera.add( orientation.multiplyScalar( 0.02 * __v1.z ) );

			}

			// calculate end state rotation of camera

			__m4.lookAt( endCamera, endPOI, Object3D.DefaultUp );

			endQuaternion.setFromRotationMatrix( __m4 ).normalize();

			// rotation to nearest degree
			rotation = Math.round( 2 * Math.acos( Math.abs( MathUtils.clamp( endQuaternion.dot( camera.quaternion ), - 1, 1 ) ) ) * MathUtils.RAD2DEG );

		}

		this.prepare = function ( endBox, requiredTargetAxis ) {

			if ( running ) return this;

			const targetAxis = __v2;
			const orientation = __v3;

			const camera = cameraManager.activeCamera;
			const cameraStart = camera.position;

			skipNext = false;

			// move camera to cardinal axis closest to current camera direction
			// or axis provided by caller

			if ( requiredTargetAxis === undefined ) {

				getCardinalAxis( targetAxis );

				if ( targetAxis.z !== 0 ) {

					// set orientation from current orientation, snapping to cardinals
					__e.setFromQuaternion( camera.quaternion );

					const direction = Math.round( 2 * ( __e.z + Math.PI ) / Math.PI );

					switch ( direction ) {

					case 0:
					case 4:

						orientation.set( 0, 1, 0 ); // S
						break;

					case 1:

						orientation.set( -1, 0, 0 ); // E
						break;

					case 2:

						orientation.set( 0, -1, 0 ); // N
						break;

					case 3:

						orientation.set( 1, 0, 0 ); // W
						break;

					default:

						orientation.set( 0, -1, 0 ); // up = N when looking vertically

					}

				}

			} else {

				targetAxis.copy( requiredTargetAxis );
				orientation.set( 0, -1, 0 ); // up = N when looking vertically

			}

			const fit = fitBox( camera, endBox, targetAxis );

			endBox.getCenter( endPOI );
			endZoom = fit.zoom;

			endCameraPosition.copy( endPOI ).add( targetAxis.negate().multiplyScalar( fit.elevation ) );

			// skip move if extremely small

			const cameraOffset = cameraStart.distanceTo( endCameraPosition );

			// calculate end state rotation of camera

			prepareRotation( endCameraPosition, orientation );

			if ( cameraOffset < 0.1 * endCameraPosition.z ) {

				// simple rotation of camera, minimal camera position change

				skipNext = ( rotation === 0 );

			} else {

				rotation = 0;

			}

			animationFunction = animateMove;

			return this;

		};

		this.preparePoint = function ( endPOIIn ) {

			if ( running ) return this;

			const camera = cameraManager.activeCamera;

			// calculate end state rotation of camera
			endPOI.copy( endPOIIn );
			endCameraPosition.copy( camera.position );

			prepareRotation( camera.position );

			// minimal camera rotation or no change of POI
			skipNext = ( rotation === 0 );

			animationFunction = animateMove;

			return this;

		};

		this.start = function ( timed ) {

			if ( running || skipNext ) return;

			if ( timed ) {

				frameCount = ( rotation > 0 ) ? Math.max( 1, Math.round( rotation / 2 ) ) : 30;

			} else {

				frameCount = 1;

			}

			controls.enabled = false;

			running = true;

			animate();

		};

		this.cancel = function () {

			if ( rafID !== 0 ) window.cancelAnimationFrame( rafID );

			if ( ! running ) return;

			frameCount = 1;
			running = false;
			rafID = 0;

			animate();

			controls.enabled = true;
			controls.autoRotate = false;

		};

		function animate () {

			if ( controls.autoRotate ) {

				controls.update();

			} else if ( animationFunction ) {

				animationFunction();

				if ( --frameCount === 0 ) {

					animationFunction = null;
					endAnimation();

				}

			}

			if ( running ) rafID = window.requestAnimationFrame( animate );

		}

		function endAnimation () {

			controls.target.copy( endPOI );
			cameraManager.activeCamera.position.copy( endCameraPosition );

			running = false;
			rotation = 0;
			rafID = 0;

			controls.enabled = true;
			controls.end();

		}

		function animateMove () {

			// update camera position

			const camera = cameraManager.activeCamera;
			const target = controls.target;
			const dt = 1 - ( frameCount - 1 ) / frameCount;

			if ( ! rotation ) {

				camera.position.lerp( endCameraPosition, dt);
				camera.zoom = camera.zoom + ( endZoom - camera.zoom ) * dt;

				if ( camera.isOrthographicCamera ) camera.updateProjectionMatrix();

				camera.lookAt( target.lerp( endPOI, dt ) );

			}

			camera.quaternion.slerp( endQuaternion, dt );

			renderFunction();

		}

		function setAngleCommon ( deltaIn ) {

			frameCount = Math.max( 1, Math.round( Math.abs( deltaIn ) * 90 / Math.PI ) );
			delta = deltaIn / frameCount;
			running = true;

			animate();

		}

		function animateAzimuthMove () {

			controls.rotateLeft( delta );

		}

		this.setAzimuthAngle = function ( targetAngle ) {

			if ( running || controls.autoRotate ) return this;

			let delta = ( controls.getAzimuthalAngle() - targetAngle );
			const deltaSize = Math.abs( delta );

			if ( deltaSize > Math.PI ) delta = 2 * Math.PI - deltaSize;

			animationFunction = animateAzimuthMove;
			setAngleCommon( delta );

		};

		function animatePolarMove () {

			controls.rotateUp( delta );

		}

		this.setPolarAngle = function ( targetAngle ) {

			if ( running ) return this;

			animationFunction = animatePolarMove;

			setAngleCommon( controls.getPolarAngle() - targetAngle );

		};

		this.setAutoRotate = function ( state ) {

			if ( state ) {

				if ( running ) return;

				controls.autoRotate = true;

				running = true;
				animationFunction = false;

				animate();

			} else {

				if ( controls.autoRotate ) running = false;

				controls.autoRotate = false;
				controls.enabled = true;
				rafID = 0;

			}

		};

		function fitBox ( camera, box, viewAxis ) {

			const size = box.getSize( __v1 );

			let elevation = CAMERA_OFFSET;
			let zoom = 1;

			let dX, dY, dZ;

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

				const tan2 = 2 * Math.tan( MathUtils.DEG2RAD * 0.5 * camera.getEffectiveFOV() );

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

		}

	}

}

export { CameraMove };