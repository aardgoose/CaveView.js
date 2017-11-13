
import  {
	Vector3, ConeBufferGeometry, Mesh, Quaternion, MeshPhongMaterial
} from '../../../../three.js/src/Three';


function ClusterLegs ( survey ) {

	var leg, i, legLength;
	var legs = [];
	var vertices = survey.getLegs();
	var l = vertices.length;

	// convert legs to unit length vectors from origin
	for ( i = 0; i < l; i += 2 ) {

		leg = new Vector3().subVectors( vertices[ i ], vertices[ i + 1 ] );
		legLength = leg.length();

		leg.normalize();
		if ( leg.z < 0 ) leg.negate();

		legs.push( {
			vector: leg,
			label: undefined,
			length: legLength
		});

	}

	var clusters = clusterLegs( legs, Math.PI / 60, 100 );

	paintClusters( clusters, survey, Math.PI / 60 );

}

function clusterLegs( legs, epsilon, minPoints ) {

	const NOISE = 99999;
	const EPS = epsilon;
	const MIN_POINTS = minPoints;

	var i, l, leg, neighbours;
	var clusterIndex = 0;

	l = legs.length;

	legs.sort( function ( a, b ) { return b.legLength - a.legLength; } );

	for ( i = 0; i < l; i++ ) {

		leg = legs[ i ];

		if ( leg === undefined || leg.label !== undefined ) continue;

		neighbours = _getNeighbours( i );

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

	var cluster;
	var clusters = [];

	for ( i = 0; i < clusterIndex; i++ ) {

		clusters[ i ] = {
			vector: new Vector3(),
			length: 0,
			label: undefined,
			size: 0
		};

	}

	var tmpVector = new Vector3;

	for ( i = 0; i < l; i++ ) {

		leg = legs[ i ];
		if ( leg === undefined || leg.label === NOISE ) continue;

		cluster = clusters[ leg.label ];

		tmpVector.copy( leg.vector );
		tmpVector.setLength( leg.length );

		cluster.vector.add( tmpVector );
		cluster.length += leg.length;
		cluster.size++;

	}

	return clusters;

	function _getNeighbours( p ) {

		var v1, v2, l;
		var neighbours = new Set();

		v1 = legs[ p ].vector;
		l = legs.length;

		for ( var i = 0; i < l; i++ ) {

			if ( i === p || legs[ i ] === undefined ) continue;

			v2 = legs[ i ].vector;
			if ( Math.acos( v1.dot( v2 ) ) < EPS ) neighbours.add( i );

		}

		return neighbours;

	}

}

function paintClusters( clusters, survey, EPS ) {

	var maxLength = 0;

	var vFrom = new Vector3( 0, 1, 0 );
	var q = new Quaternion();
	var cluster, vector, i, d, c1, c2, c3;

	clusters.sort( function ( a, b ) { return b.length - a.length; });

	for ( i = 0; i < clusters.length; i++ ) {

		cluster = clusters[ i ];

		cluster.vector.normalize();
		maxLength =  Math.max( cluster.length, maxLength );

	}

	c1 = clusters[ 0 ].vector;

	var mostDistant;

	mostDistant = _findMostDistant( c1 );

	c2 = clusters[ mostDistant ].vector;

	var tmp = new Vector3().addVectors( c1, c2 ).normalize();

	mostDistant = _findMostDistant( tmp );

	c3 = clusters[ mostDistant ].vector;

	console.log ( 'cc2', mostDistant, c3 );

	survey.setColourAxis( c1, c2, c3 );

	for ( i = 0; i < clusters.length; i++ ) {

		cluster = clusters[ i ];
		vector = cluster.vector;

		var o = 200 * Math.max( cluster.length / maxLength );

		var cone = new ConeBufferGeometry( EPS * o / 2, o, 16 );

		cone.translate( 0, -o / 2, 0 );

		var r = Math.round( Math.abs( vector.dot( c1 ) ) * 255 ) * 0xffff;
		var g = Math.round( Math.abs( vector.dot( c2 ) ) * 255 ) * 0xff;
		var b = Math.round( Math.abs( vector.dot( c3 ) ) * 255 );

		var color = r + g + b;

		var m = new Mesh( cone, new MeshPhongMaterial( { color: color } ) );
		var n = cluster.vector.clone().negate();
		q.setFromUnitVectors( vFrom, n );
		m.applyQuaternion( q );

		survey.add( m );

	}

	return clusters;

	function _findMostDistant( vector ) {

		var i, mostDistant;
		var minD = 1;

		for ( i = 0; i < clusters.length; i++ ) {

			d = Math.abs( vector.dot( clusters[ i ].vector ) );

			if ( d < minD ) {

				minD = d;
				mostDistant = i;

			}

		}

		return mostDistant;

	}

}

export { ClusterLegs };
