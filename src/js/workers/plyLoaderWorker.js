import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { FileLoader  } from '../loaders/FileLoader';

onmessage = onMessage;

let fileLoader = null;

function onMessage( event ) {

	const data = event.data;

	if ( data?.action === 'abort' && fileLoader !== null ) {

		fileLoader.abort();
		return;

	}

	const file = data.file;
	const loadingContext = data.loadingContext;

	fileLoader = new FileLoader( file );

	fileLoader.load( 'arraybuffer', loadingContext, progress ).then( results => {

		console.time( 'total' );
		const geometry = new PLYLoader().parse( results.data );

		console.timeEnd( 'total' );
		geometry.computeBoundingBox();

		// support transferable objects where possible

		const transferable = [];

		const attributes = geometry.attributes;
		const index = geometry.index;

		for ( const attributeName in attributes ) {

			transferable.push( attributes[ attributeName ].array.buffer );

		}

		if ( index ) transferable.push( index.array.buffer );

		postMessage(
			{
				status: 'ok',
				index: index,
				boundingBox: geometry.boundingBox,
				attributes: attributes,
				metatdata: results.metatdata
			},
			transferable
		);

	}, error => postMessage( { status: 'error', message: error } ) ); // reject handler

	function progress ( event ) {

		postMessage( {
			status: 'progress',
			loaded: event.loaded,
			total: event.total
		} );

	}

}