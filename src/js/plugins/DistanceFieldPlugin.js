import { NearestFilter, Vector2, Vector3, WebGLRenderTarget, OrthographicCamera } from 'three';
import { DistanceFieldPass } from './distanceField/DistanceFieldPass';
import { DistanceFieldFilterPass } from './distanceField/DistanceFieldFilterPass';
import { RenderUtils } from '../core/RenderUtils';
import { LEG_CAVE } from '../core/constants';

class DistanceFieldPlugin {

	constructor ( ctx, /* renderer, scene */ ) {

		console.log( 'Distance Field Plugin 0.0' );

		const viewer = ctx.viewer;

		viewer.getComposer = function ( renderer, scene ) {

			const width  = 300;
			const height = 300;

			const renderTarget1 = new WebGLRenderTarget( width, height, { depthBuffer: false, minFilter: NearestFilter, magFilter: NearestFilter } );
			const renderTarget2 = new WebGLRenderTarget( width, height, { depthBuffer: false, minFilter: NearestFilter, magFilter: NearestFilter } );

			const distancePass = new DistanceFieldPass( width, height );
			const distanceFilterPass = new DistanceFieldFilterPass( width, height );

			let lastNode = null;

			function dumpTarget ( renderTarget ) {

				const canvas = RenderUtils.renderTargetToCanvas( renderer, renderTarget );

				if ( lastNode ) {

					lastNode.replaceWith( canvas );

				} else {

					document.body.appendChild( canvas );

				}

				lastNode = canvas;

			}

			return () => {

				const survey = scene.getObjectByProperty( 'type', 'CV.Survey' );

				if ( survey === undefined ) return;

				renderer.setRenderTarget( renderTarget1 );
				renderer.setPixelRatio( 1 );
				renderer.setSize( width, height );
				renderer.setClearColor( 'white', 1.0 );
				renderer.clear();

				const camera = fred( ctx.container, survey );

				camera.layers.enable( LEG_CAVE );

				renderer.render( scene, camera );

				let source = renderTarget1;
				let target = renderTarget2;

				distanceFilterPass.render( renderer, target, source );

				swapBuffers();

				const offset = new Vector2();

				offset.set( 1 / width, 0 );

				for ( let i = 1; i < 250; i += 2 ) {

					distancePass.render( renderer, target, source, { beta: i, offset: offset } );

					swapBuffers();

				}


				offset.set( 0, 1 / height );

				for ( let i = 1; i < 250; i += 2 ) {

					distancePass.render( renderer, target, source, { beta: i, offset: offset } );

					swapBuffers();

				}

				dumpTarget( source );

				ctx.viewer.resetRenderer();

				function swapBuffers() {

					const tmp = source;

					source = target;
					target = tmp;

				}

			};

		};

	}

}

function fred ( container, survey ) {

	let width  = container.clientWidth;
	let height = container.clientHeight;

	const range = survey.combinedLimits.getSize( new Vector3() );

	const scaleX = width / range.x;
	const scaleY = height / range.y;

	if ( scaleX < scaleY ) {

		height = height * scaleX / scaleY;

	} else {

		width = width * scaleY / scaleX;

	}

	return  new OrthographicCamera( -width / 2, width / 2, height / 2, -height / 2, -10000, 10000 );

}

export { DistanceFieldPlugin };