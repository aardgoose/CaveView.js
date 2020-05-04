import 'three/src/polyfills';

import { Mesh } from 'three/src/objects/Mesh';
import { BufferGeometry } from 'three/src/core/BufferGeometry';
import { MeshStandardMaterial } from 'three/src/materials/MeshStandardMaterial';
import { Scene } from 'three/src/scenes/Scene';
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { Texture } from 'three/src/textures/Texture';

onmessage = onMessage;

const gradient = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAABCAYAAAC/iqxnAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TS0UqHewg4pChioMFURFHqWIRLJS2QqsOJpd+QZOGJMXFUXAtOPixWHVwcdbVwVUQBD9AnBydFF2kxP8lhRYxHhz34929x907QGhWmWr2TACqZhnpRFzM5VfF4CsCEBDGGAYlZurJzGIWnuPrHj6+3sV4lve5P0e/UjAZ4BOJ55huWMQbxDObls55nzjCypJCfE48btAFiR+5Lrv8xrnksMAzI0Y2PU8cIRZLXSx3MSsbKvE0cVRRNcoXci4rnLc4q9U6a9+TvzBU0FYyXKc5jASWkEQKImTUUUEVFmK0aqSYSNN+3MM/5PhT5JLJVQEjxwJqUCE5fvA/+N2tWZyadJNCcSDwYtsfI0BwF2g1bPv72LZbJ4D/GbjSOv5aE5j9JL3R0aJHQHgbuLjuaPIecLkDDD7pkiE5kp+mUCwC72f0TXlg4BboW3N7a+/j9AHIUlfLN8DBITBaoux1j3f3dvf275l2fz9g7nKgkqYRWgAAAHJJREFUCNcFwb0OAUEYhtHn3T8rQiWYRaLUumUXpCEa2ZWszYRSpZj5dpyjs7rUZRWXVPDMpzyWFaEu0CRHc9Aa1IzIfdHGkzV3andl5m4sVi2H8scJ44ixj7B9J3YfUfoAQ4TBoA/witAbeIMwAqCU+AMBRCgAPCz4IQAAAABJRU5ErkJggg==';

function onMessage ( event ) {

	const data = event.data;

	const geometry = new BufferGeometry();

	geometry.setIndex( data.index );
	geometry.setAttribute( 'position', data.position );

	const vertices = data.position.array;
	const vertexCount = vertices.length / 3;

	const uvs = new Float32BufferAttribute( vertexCount * 2, 2 );
	const uvBuffer = uvs.array;

	const zz = data.modelLimits.max.z;
	const z2 = 2 * zz;

	var i;

	for ( i = 0; i < vertexCount; i++ ) {

		let zOffset = i * 3 + 2; // ( offset of Z value )
		let offset = i * 2;

		let u = ( vertices[ zOffset ] + zz ) / z2;

		uvBuffer[ offset ] = u;
		uvBuffer[ offset + 1 ] = u;

	}

	geometry.setAttribute( 'uv', uvs );

	const material = new MeshStandardMaterial();

	material.map = new Texture( gradient );

	console.log( gradient.substring( 0, 10 ) );
	const walls = new Mesh( geometry, material );

	const scene = new Scene();

	scene.add( walls );

	const exporter = new GLTFExporter();

	exporter.parse( scene, function ( result ) {

		console.log( 'done' );

		var output = JSON.stringify( result, null, 2 );

		postMessage( { status: 'ok', gltf: output } );

	} );

}
