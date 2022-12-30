import { Box3, Float32BufferAttribute, Uint16BufferAttribute, Uint32BufferAttribute } from '../Three';

function replaceExtension( fileName, newExtention ) {

	if ( fileName === undefined ) return 'file set';

	return fileName.split( '.' ).shift() + '.' + newExtention;

}

function dataURL( json ) {

	return 'data:text/json;charset=utf8,' + encodeURIComponent( JSON.stringify( json, null, '\t' ) );

}

function hydrateGeometry( bufferGeometry, data ) {

	const attributes = data.attributes;
	const index = data.index;

	// assemble BufferGeometry from binary buffer objects transfered from worker

	for ( let attributeName in attributes ) {

		let attribute = attributes[ attributeName ];
		bufferGeometry.setAttribute( attributeName, new Float32BufferAttribute( attribute.array.buffer, attribute.itemSize ) );

	}

	if ( index.array.BYTES_PER_ELEMENT == 2 ) {

		bufferGeometry.setIndex( new Uint16BufferAttribute( index.array.buffer, 1 ) );

	} else {

		bufferGeometry.setIndex( new Uint32BufferAttribute( index.array.buffer, 1 ) );

	}


	// use precalculated bounding box rather than recalculating it here.

	bufferGeometry.boundingBox = new Box3().copy( data.boundingBox );

}

export { replaceExtension, dataURL, hydrateGeometry };