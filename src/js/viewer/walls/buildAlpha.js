import {
	FACE_ALPHA, LEG_SPLAY,
} from '../../core/constants';

import { WorkerPool } from '../../core/WorkerPool';

import { Walls } from './Walls';

import { Float32BufferAttribute } from '../../Three';


function buildAlpha ( survey ) {

	const stations = survey.stations;
	const vertices = [];
	const indices = [];

	const segments = [];

	var points;
	var pending = 0;
	var i, j;

	// allocate splays to segments

	if ( ! survey.hasFeature( LEG_SPLAY ) ) return;

	const splayLineSegments = survey.getFeature( LEG_SPLAY );
	const splays = splayLineSegments.geometry.vertices;

	for ( i = 0; i < splays.length; i += 2 ) {

		const v1 = splays[ i ];
		const v2 = splays[ i + 1 ];

		const s1 = stations.getStation( v1 );
		const s2 = stations.getStation( v2 );

		let linkedSegments;

		if ( s1 === undefined || s2 === undefined ) continue;

		if ( s1.hitCount === 0 ) {

			linkedSegments = s2.linkedSegments;

		} else {

			linkedSegments = s1.linkedSegments;

		}

		// console.log( station.name, segments );

		for ( j = 0; j < linkedSegments.length; j++ ) {

			const s = linkedSegments[ j ];

			if ( segments[ s ] === undefined ) segments[ s ] = new Set();

			segments[ s ].add( v1 );
			segments[ s ].add( v2 );

		}

	}

	// submit each set of segment points to Worker

	const workerPool = new WorkerPool( 'alphaWorker.js' );

	// TODO - make queueing pool
	// only submit more work when current queue depth < max

	for ( i = 0; i < segments.length; i++ ) {

		const segment = segments[ i ];

		if ( segment === undefined ) continue;

		const segmentPointSet = segment;
		points = [];

		segmentPointSet.forEach( _addPoints );

		workerPool.queueWork(
			{
				segment: i,
				points: points,
				alpha: 0.08
			},
			_wallsLoaded
		);

		pending++;

	}

	const mesh = new Walls();

	mesh.ready = false;

	survey.addFeature( mesh, FACE_ALPHA, 'CV.Survey:faces:alpha' );

	return;

	function _wallsLoaded ( event ) {

		const cells = event.data.cells;
		const worker = event.currentTarget;
		const segment = event.data.segment;
		const offset = vertices.length / 3;

		console.log( 'alpha walls loaded:', segment, cells.length );

		workerPool.putWorker( worker );

		var i;

		// populate vertices and indices in order of worker completion

		const segmentPointSet = segments[ segment ];

		segmentPointSet.forEach( _addVertices );

		for ( i = 0; i < cells.length; i++ ) {

			const c = cells[ i ];
			indices.push( c[ 0 ] + offset, c[ 1 ] + offset, c[ 2 ] + offset );

		}

		if ( --pending > 0 ) return;

		console.log( 'loading complete alpha walls' );

		// build geometry

		const geometry = mesh.geometry;

		geometry.setIndex( indices );
		geometry.addAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );

		geometry.computeVertexNormals();

		mesh.ready = true;

		survey.dispatchEvent( { type: 'changed', name: 'changed' } );

		// return worker to pool

	}

	function _addPoints ( point ) {

		points.push( [ point.x, point.y, point.z ] );

	}

	function _addVertices ( point ) {

		vertices.push( point.x, point.y, point.z );

	}

}

export { buildAlpha };

// EOF