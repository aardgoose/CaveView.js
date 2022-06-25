import { DistanceFieldFilterPass } from './DistanceFieldFilterPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

class DistanceFieldPlugin {

	constructor ( ctx, /* renderer, scene */ ) {

		console.log( 'Distance Field Plugin 0.0' );

		const viewer = ctx.viewer;

		viewer.getComposer = function ( renderer, scene, camera, container ) {

			const composer = new EffectComposer( renderer );
			const renderPass = new RenderPass( scene, camera );
			const filterPass = new DistanceFieldFilterPass( container.innerWidth, container.innerHeight );

			composer.addPass( renderPass );
			composer.addPass( filterPass );

			return composer;

		};

	}

/*
	render () {

		// create two render targets (use screen initially for one)?

		let source = screen;
		let target = new_target;

		// first pass to render to 0 or Infinity (black/other) image

		// render filter (selected objects/orientation)

		// incremental render loop

		let beta = 1;s
		let samplesPassed = 1;

		while ( samplesPassed > 0 ) {

			samplesPassed = this.renderPass( source, target, beta );

			console.log( beta, samplesPassed );

			beta += 2;
			const tmp = source;
			source = target;
			target = tmp;

		}

	}

	renderPass ( source, target, beta ) {

		// create query object.

		// begin query (samples passed )


		// render DistanceFieldShader
		// end query

		// get query results
		const samplesPassed = 0;

		return samplesPassed;

	}
*/
}

export { DistanceFieldPlugin };