
import  {
	Vector3, ConeBufferGeometry, Mesh, Quaternion, MeshPhongMaterial
} from '../../../../three.js/src/Three';


function ClusterLegs ( survey ) {

	const vertices = survey.getLegs();
	const l = vertices.length;
	const legs = [];

	var i;

	// convert legs to unit length vectors from origin
	for ( i = 0; i < l; i += 2 ) {

		let leg = new Vector3().subVectors( vertices[ i ], vertices[ i + 1 ] );
		let legLength = leg.length();

		leg.normalize();

		if ( leg.z < 0 ) leg.negate();

		legs.push( {
			vector: leg,
			label: undefined,
			length: legLength
		});

	}

	const clusters = clusterLegs( legs, Math.PI / 60, 100 );

	paintClusters( clusters, survey, Math.PI / 60 );

}

function clusterLegs( legs, epsilon, minPoints ) {

	const NOISE = 99999;
	const EPS = epsilon;
	const MIN_POINTS = minPoints;
	const l = legs.length;
	const tmpVector = new Vector3();
	const clusters = [];

	var i;
	var clusterIndex = 0;

	legs.sort( function ( a, b ) { return b.legLength - a.legLength; } );

	for ( i = 0; i < l; i++ ) {

		let leg = legs[ i ];

		if ( leg === undefined || leg.label !== undefined ) continue;

		const neighbours = _getNeighbours( i );

		if ( neighbours.size < MIN_POINTS ) {

			leg.label = NOISE;
			continue;

		}

		leg.label = clusterIndex;

		neighbours.forEach( function ( e ) {

			var leg = legs[ e ];
			if ( leg.label === NOISE ) leg.label = clusterIndex;
			if ( leg.label !== undefined ) return;

			leg.label = clusterIndex;

		} );

		clusterIndex++;

	}

	console.log( 'leg count:', legs.length, 'cluster count:', clusterIndex );

	for ( i = 0; i < clusterIndex; i++ ) {

		clusters[ i ] = {
			vector: new Vector3(),
			length: 0,
			label: undefined,
			size: 0
		};

	}

	for ( i = 0; i < l; i++ ) {

		let leg = legs[ i ];

		if ( leg === undefined || leg.label === NOISE ) continue;

		let cluster = clusters[ leg.label ];

		tmpVector.copy( leg.vector );
		tmpVector.setLength( leg.length );

		cluster.vector.add( tmpVector );
		cluster.length += leg.length;
		cluster.size++;

	}

	return clusters;

	function _getNeighbours( p ) {

		const neighbours = new Set();
		const l = legs.length;

		var i;

		const v1 = legs[ p ].vector;

		for ( i = 0; i < l; i++ ) {

			if ( i === p || legs[ i ] === undefined ) continue;

			const v2 = legs[ i ].vector;

			if ( Math.acos( v1.dot( v2 ) ) < EPS ) neighbours.add( i );

		}

		return neighbours;

	}

}

function paintClusters( clusters, survey, EPS ) {

	const vFrom = new Vector3( 0, 1, 0 );
	const tmpVector = new Vector3();

	const q = new Quaternion();

	var i, maxLength = 0;

	clusters.sort( function ( a, b ) { return b.length - a.length; });

	for ( i = 0; i < clusters.length; i++ ) {

		const cluster = clusters[ i ];

		cluster.vector.normalize();
		maxLength =  Math.max( cluster.length, maxLength );

	}

	// primary direction
	const c1 = clusters[ 0 ].vector;

	// secondary direction
	const c2 = clusters[ _findMostDistant( c1 ) ].vector;

	tmpVector.addVectors( c1, c2 ).normalize();

	// tertiary direction ( distant to plane of c1 and c2 )
	const c3 = clusters[ _findMostDistant( tmpVector ) ].vector;

	survey.setColourAxis( c1, c2, c3 );

	// depict clusters as scaled cones coloured based on 1st 3 directions

	for ( i = 0; i < clusters.length; i++ ) {

		const cluster = clusters[ i ];
		const vector = cluster.vector;

		// scale cluster cone
		const o = 200 * Math.max( cluster.length / maxLength );

		const cone = new ConeBufferGeometry( EPS * o / 2, o, 16 );

		cone.translate( 0, -o / 2, 0 );

		const r = Math.round( Math.abs( vector.dot( c1 ) ) * 255 ) * 0xffff;
		const g = Math.round( Math.abs( vector.dot( c2 ) ) * 255 ) * 0xff;
		const b = Math.round( Math.abs( vector.dot( c3 ) ) * 255 );

		const color = r + g + b;

		const m = new Mesh( cone, new MeshPhongMaterial( { color: color } ) );
		const n = cluster.vector.clone().negate();

		q.setFromUnitVectors( vFrom, n );
		m.applyQuaternion( q );

		survey.add( m );

	}

	return clusters;

	function _findMostDistant( vector ) {

		var i, mostDistant;
		var minD = 1;

		for ( i = 0; i < clusters.length; i++ ) {

			const d = Math.abs( vector.dot( clusters[ i ].vector ) );

			if ( d < minD ) {

				minD = d;
				mostDistant = i;

			}

		}

		return mostDistant;

	}

}

export { ClusterLegs };
