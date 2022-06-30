import { NearestFilter, Vector2, Vector3, WebGLRenderTarget } from 'three';
import { DistanceFieldPass } from './distanceField/DistanceFieldPass';
import { DistanceFieldFilterPass } from './distanceField/DistanceFieldFilterPass';
import { RenderUtils } from '../core/RenderUtils';
import { FACE_SCRAPS, FACE_WALLS, LEG_CAVE } from '../core/constants';
import { TextureLookup } from '../core/TextureLookup';

class DistanceSquaredLookup extends TextureLookup {

	scale = 1;

	constructor ( renderer, renderTarget, boundingBox, scale ) {

		super( renderer, renderTarget, boundingBox );
		this.scale = scale;

	}

	lookup ( point ) {

		return super.lookup( point ) * this.scale;

	}

}

class DistanceFieldPlugin {

	constructor ( ctx, renderer, scene ) {

		console.log( 'Distance Field Plugin 0.0' );

		if ( ! renderer.capabilities.isWebGL2 ) {

			console.warn( 'DistanceField plugin requires WebGL2' );
			return;

		}

		const viewer = ctx.viewer;

		viewer.addEventListener( 'newCave', createDistanceField );

		function createDistanceField( event ) {

			const survey = event.survey;

			if ( survey === undefined ) return;

			const width  = 1024;
			const range = survey.combinedLimits.getSize( new Vector3() );
			const scale = range.x / 1024; // scale metres per texture pixel

			const height = Math.round( range.y / scale );

			// save current display settings
			const cfg = ctx.cfg;
			const savedColor = cfg.themeColorCSS( 'shading.single' );
			const savedShadingMode = survey.getShadingMode();
			const pixelIncrement = 256 * 128; // unit for distance calculations  (full width / pixelIncrement )

			cfg.themeColorCSS( 'shading.single', 'black' );

			const distancePass = new DistanceFieldPass( width, height, pixelIncrement );
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

			const offset = new Vector2();

			runPass( offset.set( 1 / width, 0 ) );  // run pass in x direction
			runPass( offset.set( 0, 1 / height ) ); // run pass in y direction

			// last pass will leave the last target as the source

			dumpTarget( target );

			const lookup = new DistanceSquaredLookup( renderer, target, survey.combinedLimits, scale * pixelIncrement );

			console.log( lookup.lookup( new Vector2( 0, 0 ) ) );
			survey.distanceSquaredLookup = lookup;

			// save distance map to arrayData
			const buffer = new Uint8ClampedArray( width * height * 4 );
			renderer.readRenderTargetPixels( target, 0, 0, width, height, buffer );

			// drop resources associated with temporary camera
			renderer.renderLists.dispose();

			// restore display settings
			cfg.themeColorCSS( 'shading.single', savedColor );
			survey.setShadingMode( savedShadingMode );

			ctx.viewer.resetRenderer();

			renderTarget1.dispose();
			renderTarget2.dispose();

			function runPass ( offset ) {

				for ( let i = 1; i < 500; i += 2 ) {

					// the last pass's traget becomes the new source.
					swapBuffers();

					distancePass.render( renderer, target, source, { beta: i, offset: offset } );

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