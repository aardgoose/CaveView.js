import { FACE_SCRAPS } from '../../core/constants';
import { Walls } from './Walls';

function buildScraps ( cave, survey ) {

	const scrapList = cave.scraps;
	const l = scrapList.length;

	if ( l === 0 ) return null;

	const mesh = survey.getFeature( FACE_SCRAPS, Walls );

	const indices = [];
	const vertices = [];

	const indexRuns = [];

	var vertexOffset = 0;
	var i, lastEnd = 0;

	for ( i = 0; i < l; i++ ) {

		_loadScrap( scrapList[ i ] );

	}

	mesh.addWalls( vertices, indices, indexRuns );

	survey.addFeature( mesh, FACE_SCRAPS, 'CV.Survey:faces:scraps' );

	return;

	function _loadScrap ( scrap ) {

		var i, l;

		for ( i = 0, l = scrap.vertices.length; i < l; i++ ) {

			vertices.push( scrap.vertices[ i ] );

		}

		for ( i = 0, l = scrap.faces.length; i < l; i++ ) {

			const face = scrap.faces[ i ];

			indices.push( face[ 0 ] + vertexOffset, face[ 2 ] + vertexOffset, face[ 1 ] + vertexOffset );

		}

		const end = indices.length;

		indexRuns.push( { start: lastEnd, count: end - lastEnd, survey: scrap.survey } );
		lastEnd = end;

		vertexOffset += scrap.vertices.length;

	}

}


export { buildScraps };

// EOF