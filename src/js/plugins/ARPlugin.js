import { PerspectiveCamera, Vector3 } from './Three';

const NORMAL = 0;
const FLAT = 1;
const SWITCH = 5;

class ARPlugin {

	constructor ( ctx, renderer, scene ) {

		console.log( 'AR Plugin 0.1' );

		const viewer = ctx.viewer;
		const locationSource = viewer.locationSource;
		const camera = new PerspectiveCamera();
		const cameraLocation = new Vector3();
		const materials = ctx.materials;

		let survey = null;
		let savedView = null;
		let mode = NORMAL;

		if ( ! locationSource ) {

			console.warn( 'location plugin must be loaded' );
			return;

		}

		if ( ! ( 'xr' in navigator ) ) return;

		window.addEventListener( 'deviceorientation', event => {

			// fixme add hysteresis.

			if ( Math.abs( event.beta ) < SWITCH && Math.abs( event.gamma ) < SWITCH ) {

				// flat mode
				console.log( 'flat mode' );
				mode = FLAT;

			} else {

				// normal AR mode
				console.log( 'normal mode' );
				mode = NORMAL;

			}

		} );

		locationSource.addEventListener( 'location', event => {

			if ( ! renderer.xr.enabled ) enable( event );

			// translate events to openGL coords

			cameraLocation.copy( event.location );
			survey.markers.mark( cameraLocation );

			const lookup = survey.distanceLookup;

			const minDistance = lookup.lookup( cameraLocation );
			const maxDistance = minDistance + 500;

			console.log( 'min', minDistance, cameraLocation.x, cameraLocation.y, cameraLocation.z );

			materials.setLocation( cameraLocation, minDistance, maxDistance );

			cameraLocation.divide( survey.modelLimits.max );

		} );

		function enable  ( event ) {

			console.log( 'has location, enable AR' );

			survey = event.survey;

			// keep in survey CRS
			// ctx.cfg.setValue( 'displayCRS', 'ORIGINAL' );

			document.body.appendChild( ARButton.createButton( renderer, {} ) );

			renderer.xr.enabled = true;

			// listen for survey events

			locationSource.addEventListener( 'invalid', () => {

				const session = renderer.getSession();

				if ( session ) session.end();

				survey = null;
				renderer.xr.enabled = false;

			} );

			renderer.xr.addEventListener( 'sessionstart', onSessionStart );

		}

		function onSessionStart () {

			survey.rotateX( - Math.PI / 2 );
			survey.updateMatrix();

			savedView = viewer.getView();

			viewer.HUD = false;
			viewer.linewidth = 1;

			scene.onBeforeRender = onSceneBeforeRender;
			renderer.setAnimationLoop( () => renderer.render( scene, camera ) );

			renderer.xr.addEventListener( 'sessionend', onSessionEnd );

		}

		function onSessionEnd () {

			renderer.xr.removeEventListener( 'sessionend', onSessionEnd );

			renderer.setAnimationLoop( null );
			scene.onBeforeRender = function () {};

			survey.rotateX( Math.PI / 2 );
			survey.updateMatrix();

			// reset initial view state
			viewer.setView( savedView );

		}

		function onSceneBeforeRender ( renderer, scene, camera ) {

			if ( camera.isArrayCamera && location !== null && camera.cameras.length ) {

				const cameraL = camera.cameras[ 0 ];
				cameraL.layers.enableAll();
				camera.layers.enableAll();

				// account for rotated coord system
				cameraL.position.x = cameraLocation.x;
				cameraL.position.z = cameraLocation.y;
				cameraL.position.y = cameraLocation.z + 0.75;

			}

		}

	}

}

class ARButton {

	static createButton( renderer, sessionInit = {} ) {

		const button = document.createElement( 'button' );

		function showStartAR( /*device*/ ) {

			if ( sessionInit.domOverlay === undefined ) {

				const overlay = document.createElement( 'div' );
				overlay.style.display = 'none';
				document.body.appendChild( overlay );

				const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
				svg.setAttribute( 'width', 38 );
				svg.setAttribute( 'height', 38 );
				svg.style.position = 'absolute';
				svg.style.right = '20px';
				svg.style.top = '20px';
				svg.addEventListener( 'click', function () {

					currentSession.end();

				} );
				overlay.appendChild( svg );

				const path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
				path.setAttribute( 'd', 'M 12,12 L 28,28 M 28,12 12,28' );
				path.setAttribute( 'stroke', '#fff' );
				path.setAttribute( 'stroke-width', 2 );
				svg.appendChild( path );

				if ( sessionInit.optionalFeatures === undefined ) {

					sessionInit.optionalFeatures = [];

				}

				sessionInit.optionalFeatures.push( 'dom-overlay' );
				sessionInit.domOverlay = { root: overlay };

			}

			//

			let currentSession = null;

			async function onSessionStarted( session ) {

				session.addEventListener( 'end', onSessionEnded );

				renderer.xr.setReferenceSpaceType( 'local' );

				await renderer.xr.setSession( session );

				button.textContent = 'STOP AR';
				sessionInit.domOverlay.root.style.display = '';

				currentSession = session;

			}

			function onSessionEnded( /*event*/ ) {

				currentSession.removeEventListener( 'end', onSessionEnded );

				button.textContent = 'START AR';
				sessionInit.domOverlay.root.style.display = 'none';

				currentSession = null;

			}

			//

			button.style.display = '';

			button.style.cursor = 'pointer';
			button.style.left = 'calc(50% - 50px)';
			button.style.width = '100px';

			button.textContent = 'START AR';

			button.onmouseenter = function () {

				button.style.opacity = '1.0';

			};

			button.onmouseleave = function () {

				button.style.opacity = '0.5';

			};

			button.onclick = function () {

				if ( currentSession === null ) {

					navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );

				} else {

					currentSession.end();

				}

			};

		}

		function disableButton() {

			button.style.display = '';

			button.style.cursor = 'auto';
			button.style.left = 'calc(50% - 75px)';
			button.style.width = '150px';

			button.onmouseenter = null;
			button.onmouseleave = null;

			button.onclick = null;

		}

		function showARNotSupported() {

			disableButton();

			button.textContent = 'AR NOT SUPPORTED';

		}

		function showARNotAllowed( exception ) {

			disableButton();

			console.warn( 'Exception when trying to call xr.isSessionSupported', exception );

			button.textContent = 'AR NOT ALLOWED';

		}

		function stylizeElement( element ) {

			element.style.position = 'absolute';
			element.style.bottom = '20px';
			element.style.padding = '12px 6px';
			element.style.border = '1px solid #fff';
			element.style.borderRadius = '4px';
			element.style.background = 'rgba(0,0,0,0.1)';
			element.style.color = '#fff';
			element.style.font = 'normal 13px sans-serif';
			element.style.textAlign = 'center';
			element.style.opacity = '0.5';
			element.style.outline = 'none';
			element.style.zIndex = '999';

		}

		if ( 'xr' in navigator ) {

			button.id = 'ARButton';
			button.style.display = 'none';

			stylizeElement( button );

			navigator.xr.isSessionSupported( 'immersive-ar' ).then( function ( supported ) {

				supported ? showStartAR() : showARNotSupported();

			} ).catch( showARNotAllowed );

			return button;

		}

	}

}

export { ARPlugin };