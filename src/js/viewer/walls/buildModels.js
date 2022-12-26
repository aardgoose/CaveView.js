import { Box3, Float32BufferAttribute, Uint16BufferAttribute, Uint32BufferAttribute } from '../../Three';
import { FACE_MODEL } from '../../core/constants';
import { Walls } from './Walls';

function buildModels ( cave, survey ) {

	const model = cave.models[ 0 ];

	if ( ! model ) return null;

	const mesh = survey.addFeature( new Walls( survey.ctx ), FACE_MODEL, 'Model' );

	const bufferGeometry = mesh.geometry;

	const attributes = model.attributes;
	const index = model.index;

	let attributeName;
	let attribute;

	// assemble BufferGeometry from binary buffer objects transfered from worker

	for ( attributeName in attributes ) {

		attribute = attributes[ attributeName ];

		bufferGeometry.setAttribute( attributeName, new Float32BufferAttribute( attribute.array.buffer, attribute.itemSize ) );

	}

	if ( index.array.BYTES_PER_ELEMENT == 2 ) {

		bufferGeometry.setIndex( new Uint16BufferAttribute( index.array.buffer, 1 ) );

	} else {

		bufferGeometry.setIndex( new Uint32BufferAttribute( index.array.buffer, 1 ) );

	}


	// use precalculated bounding box rather than recalculating it here.

	bufferGeometry.boundingBox = new Box3().copy( model.boundingBox );

	mesh.boundingBox = bufferGeometry.boundingBox;

	// discard javascript attribute buffers after upload to GPU
	mesh.dropBuffers();

	bufferGeometry.computeVertexNormals();
	bufferGeometry.computeBoundingBox();

	mesh.translateX( - survey.offsets.x );
	mesh.translateY( - survey.offsets.y );
	mesh.translateZ( - survey.offsets.z );

	mesh.updateMatrix();
	mesh.updateMatrixWorld();

	mesh.indexRuns = [];

	return;

}

export { buildModels };