import { Float32BufferAttribute } from '../Three';
import { FACE_SCRAPS, FACE_WALLS, LEG_CAVE } from '../core/constants';

class ExportGltf {

	constructor ( ctx, survey, selection, options, callback ) {

		const items = [];

		if ( selection.walls ) {

			items.push( getMesh( FACE_WALLS ) );

		}

		if ( selection.scraps ) {

			items.push( getMesh( FACE_SCRAPS ) );

		}

		if ( selection.legs ) {

			const legs = survey.getFeature( LEG_CAVE );

			const geometry = legs.geometry;

			// the underlying array of the interleavedInstanceBuffer is correct for GL_LINES
			const array = geometry.getAttribute( 'instanceStart' ).array;

			items.push( {
				type: 'lines',
				index: geometry.index,
				position: new Float32BufferAttribute( array, 3, false ),
				modelLimits: survey.modelLimits
			} );

		}

		if ( items.length === 0 ) return;

		const worker = new Worker( ctx.cfg.value( 'home', '' ) + 'js/workers/gltfWorker.js' );

		worker.addEventListener( 'message', function ( event ) {

			if ( event.data.status === 'ok' ) {

				let mimeType;

				if ( options.binary ) {

					mimeType = 'application/octet-stream';

				} else {

					mimeType = 'application/gltf+json';

				}

				callback( new Blob( [ event.data.gltf ], { type : mimeType } ), options.binary );

			} else {

				console.warn( event.data.error );

			}

			worker.terminate();

		} );

		worker.postMessage( { items: items, options: options } );

		function getMesh ( tag ) {

			const mesh = survey.getFeature( tag );
			const geometry = mesh.geometry;

			return {
				type: 'walls',
				index: geometry.index,
				position: geometry.getAttribute( 'position' ),
				modelLimits: survey.modelLimits
			};
		}

	}

}

export { ExportGltf };