import { Points, BufferGeometry } from '../../Three';
import { FACE_MODEL } from '../../core/constants';
import { Walls } from './Walls';
import { hydrateGeometry } from '../../core/lib';
import { CloudPointsMaterial } from '../../materials/CloudPointsMaterial';

function buildModels ( surveyData, survey ) {

	const model = surveyData.models[ 0 ];

	if ( ! model ) return null;
	let mesh = null;

	if ( model.index ) {

		mesh = survey.addFeature( new Walls( survey.ctx ), FACE_MODEL, 'Model' );

	} else {

		const m = new Points( new BufferGeometry(), new CloudPointsMaterial() );

		console.log( 'no indices: assuming point cloud' );
		mesh = survey.addFeature( m, FACE_MODEL, 'Model' );

		mesh.material.vertexColors = true;

		mesh.setShading = ( s ) => { console.log( 'mode', s ) };

	}

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