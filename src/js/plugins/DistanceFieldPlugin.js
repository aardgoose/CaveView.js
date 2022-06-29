import { NearestFilter, Vector2, WebGLRenderTarget } from 'three';
import { DistanceFieldPass } from './distanceField/DistanceFieldPass';
import { DistanceFieldFilterPass } from './distanceField/DistanceFieldFilterPass';
import { RenderUtils } from '../core/RenderUtils';
import { FACE_SCRAPS, FACE_WALLS, LEG_CAVE } from '../core/constants';

class DistanceFieldPlugin {

	constructor ( ctx, renderer, scene ) {

		console.log( 'Distance Field Plugin 0.0' );

		const viewer = ctx.viewer;

		/*

		const savedView = viewer.getView();

		const pluginView = {
			shadingMode: CV2.SHADING_SINGLE,
		};

		viewer.setView( pluginView );
		viewer.setView( savedView );

		*/
		viewer.addEventListener( 'newCave', createDistanceField );

		function createDistanceField( event ) {

			const survey = event.survey;

			if ( survey === undefined ) return;

			const width  = 1000;
			const height = 600;

			const distancePass = new DistanceFieldPass( width, height );
			const distanceFilterPass = new DistanceFieldFilterPass( width, height );

			let lastNode = null;

			const renderTarget1 = new WebGLRenderTarget( width, height, { depthBuffer: false, minFilter: NearestFilter, magFilter: NearestFilter } );
			const renderTarget2 = new WebGLRenderTarget( width, height, { depthBuffer: false, minFilter: NearestFilter, magFilter: NearestFilter } );

			renderTarget1.texture.generateMipmaps = false;
			renderTarget2.texture.generateMipmaps = false;

			renderer.setRenderTarget( renderTarget1 );
			renderer.setPixelRatio( 1 );
			renderer.setSize( width, height );
			renderer.setClearColor( 'white', 1.0 );
			renderer.clear();

			const camera = RenderUtils.makePlanCamera( ctx.container, survey );

			camera.layers.enable( LEG_CAVE );
			camera.layers.enable( FACE_SCRAPS );
			camera.layers.enable( FACE_WALLS );

			renderer.render( scene, camera );

			let source = renderTarget1;
			let target = renderTarget2;

			distanceFilterPass.render( renderer, target, source );

			swapBuffers();

			const offset = new Vector2();

			runPass( offset.set( 1 / width, 0 ) );  // run pass in x direction
			runPass( offset.set( 0, 1 / height ) ); // run pass in y direction

			dumpTarget( source );

			// save distance map to arrayData
			const buffer = new Uint8ClampedArray( width * height * 4 );
			renderer.readRenderTargetPixels( target, 0, 0, width, height, buffer );

			// drop resources associated with temporary camera
			renderer.renderLists.dispose();

			ctx.viewer.resetRenderer();

			renderTarget1.dispose();
			renderTarget2.dispose();

			function runPass ( offset ) {

				for ( let i = 1; i < 500; i += 2 ) {

					distancePass.render( renderer, target, source, { beta: i, offset: offset } );

					swapBuffers();

				}

			}

			function swapBuffers () {

				const tmp = source;

				source = target;
				target = tmp;

			}

			function dumpTarget ( renderTarget ) {

				const canvas = RenderUtils.renderTargetToCanvas( renderer, renderTarget );

				if ( lastNode ) {

					lastNode.replaceWith( canvas );

				} else {

					document.body.appendChild( canvas );

				}

				lastNode = canvas;

			}

		}

	}

}

export { DistanceFieldPlugin };