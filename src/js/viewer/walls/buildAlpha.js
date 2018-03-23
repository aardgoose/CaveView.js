import {
	FACE_WALLS, FACE_ALPHA,
} from '../../core/constants';

import { WorkerPool } from '../../core/WorkerPool';

import { Walls } from './Walls';

import { Float32BufferAttribute } from '../../Three';


function buildAlpha ( survey ) {

	const sVertices = survey.stations.vertices;
	const points = [];
	const vertices = [];

	var i;

	// all very inefficient - copy stations position attribute buffer.
	// tranfer to worker to offload processing of main thread

	for ( i = 0; i < sVertices.length; i++ ) {

		const v = sVertices[ i ];

		points.push( [ v.x, v.y, v.z ] );
		vertices.push( v.x, v.y, v.z );

	}

	// add LRUD vertices

	const walls = survey.getFeature( FACE_WALLS, Walls );

	const position = walls.geometry.getAttribute( 'position' );
	const tbArray = position.array;

	for ( i = 0; i < position.count; i++ ) {

		const offset = i * 3;

		points.push( [ tbArray[ offset ], tbArray[ offset + 1 ], tbArray[ offset + 2 ] ] );
		vertices.push( tbArray[ offset ], tbArray[ offset + 1 ], tbArray[ offset + 2 ] );

	}

	const workerPool = new WorkerPool( 'alphaWorker.js' );

	const worker = workerPool.getWorker();

	worker.onmessage = _wallsLoaded;

	worker.postMessage( {
		points: points,
		alpha: 0.08
	} );

	const mesh = new Walls();

	mesh.ready = false;

	survey.addFeature( mesh, FACE_ALPHA, 'CV.Survey:faces:alpha' );

	function _wallsLoaded ( event ) {

		console.log( 'alpha walls loaded:', event.data.status );

		const cells = event.data.cells;
		const indices = [];
		var i;

		for ( i = 0; i < cells.length; i++ ) {

			const c = cells[ i ];
			indices.push( c[ 0 ], c[ 1 ] , c[ 2 ] );

		}

		// build geometry

		const geometry = mesh.geometry;

		geometry.setIndex( indices );
		geometry.addAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );

		geometry.computeVertexNormals();

		mesh.ready = true;

		survey.dispatchEvent( { type: 'changed', name: 'changed' } );

		// return worker to pool

		workerPool.putWorker( worker );

	}

}

export { buildAlpha };

// EOF