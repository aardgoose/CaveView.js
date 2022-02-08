import { Mesh } from 'three/src/objects/Mesh.js';
import { BufferGeometry } from 'three/src/core/BufferGeometry.js';
import { MeshStandardMaterial } from 'three/src/materials/MeshStandardMaterial.js';
import { Scene } from 'three/src/scenes/Scene.js';
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute.js';
import { GLTFExporter } from '../core/GLTFExporter.js';
import { Texture } from 'three/src/textures/Texture.js';
import { LineSegments } from 'three/src/objects/LineSegments.js';

onmessage = onMessage;

const gradient = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAACCAYAAAA5Ht7JAAAAd0lEQVQY08XBzQ7BQBSA0e9Of1SElWCKxNLWK3sgG2IjKqlm0i6tLGZur8dwjpylscaVXCznlU15LEtilSOTDJmDrEHqEfEfZBNw9Z3KX5n5G4vVk0Px5YRyRNkn2PbGbhCKEKFL0Cm0Ed4JWoWgEEcAxAzHn/0AK3IoAmtWeUsAAAAASUVORK5CYII=';

function onMessage ( event ) {

	const data = event.data;
	const options = data.options;

	const scene = new Scene();

	data.items.forEach( function ( item ) { scene.add( getItem( item, options ) ); } );

	const exporter = new GLTFExporter();

	exporter.parse(
		scene,
		function ( result ) {

			if ( options.binary ) {

				postMessage( { status: 'ok', gltf: result }, [ result ] );

			} else {

				const output = JSON.stringify( result, null, 2 );
				postMessage( { status: 'ok', gltf: output } );

			}

		},
		{ binary: options.binary }
	);

}

function getItem( item, options ) {

	switch ( item.type ) {

	case 'walls':
		return getWalls( item, options );

	case 'lines':
		return getLines( item, options );

	default:
		console.error( 'unknown item type', item.type, ' requested' );

	}

}

function getWalls( item, options ) {

	const geometry = new BufferGeometry();

	geometry.setIndex( item.index );
	geometry.setAttribute( 'position', item.position );

	const vertices = item.position.array;
	const vertexCount = vertices.length / 3;

	const uvs = new Float32BufferAttribute( vertexCount * 2, 2 );
	const uvBuffer = uvs.array;

	const zz = item.modelLimits.max.z;
	const z2 = 2 * zz;

	for ( let i = 0; i < vertexCount; i++ ) {

		const zOffset = i * 3 + 2; // ( offset of Z value )
		const offset = i * 2;

		const u = ( vertices[ zOffset ] + zz ) / z2;

		uvBuffer[ offset ] = u;
		uvBuffer[ offset + 1 ] = u;

	}

	geometry.setAttribute( 'uv', uvs );

	const material = new MeshStandardMaterial( { map: new Texture( gradient ) } );

	if ( options.rotate ) {

		rotateAxes( vertices );

	}

	return new Mesh( geometry, material );

}

function getLines( item, options ) {

	const geometry = new BufferGeometry();

	geometry.setIndex( item.index );
	geometry.setAttribute( 'position', item.position );

	const material = new MeshStandardMaterial();

	if ( options.rotate ) {

		rotateAxes( item.position.array );

	}

	return new LineSegments( geometry, material );

}

function rotateAxes( vertices ) {

	const vertexCount = vertices.length;

	// rotate axes for z up.
	for ( let i = 0; i < vertexCount; i++ ) {

		const v = i * 3;
		const z = vertices[ v + 2 ];

		vertices[ v + 2 ] = -vertices[ v + 1 ]; // z = -y
		vertices[ v + 1 ] = z; // y = z

	}

}