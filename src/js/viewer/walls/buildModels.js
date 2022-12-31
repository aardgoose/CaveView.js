import { FACE_MODEL } from '../../core/constants';
import { Walls } from './Walls';
import { hydrateGeometry } from '../../core/lib';

function buildModels ( surveyData, survey ) {

	const model = surveyData.models[ 0 ];

	if ( ! model ) return null;

	const mesh = survey.addFeature( new Walls( survey.ctx ), FACE_MODEL, 'Model' );

	const bufferGeometry = mesh.geometry;

	hydrateGeometry( bufferGeometry, model );

	mesh.boundingBox = bufferGeometry.boundingBox;

	// discard javascript attribute buffers after upload to GPU
	mesh.dropBuffers();

	bufferGeometry.computeVertexNormals();

	mesh.translateX( - survey.offsets.x );
	mesh.translateY( - survey.offsets.y );
	mesh.translateZ( - survey.offsets.z );

	mesh.updateMatrix();
	mesh.updateMatrixWorld();

	mesh.indexRuns = [];

	return;

}

export { buildModels };