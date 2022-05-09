import { Mesh } from 'three/src/objects/Mesh.js';
import { BufferGeometry } from 'three/src/core/BufferGeometry.js';
import { MeshStandardMaterial } from 'three/src/materials/MeshStandardMaterial.js';
import { Scene } from 'three/src/scenes/Scene.js';
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute.js';
import { Uint16BufferAttribute } from 'three/src/core/BufferAttribute';
import { Uint32BufferAttribute } from 'three/src/core/BufferAttribute';
import { GLTFExporter } from '../core/GLTFExporter';
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
		function ( e ) {
			postMessage( { status: 'error', error: e } );
		},
		{ binary: options.binary, embedImages: false }
	);

}

function getItem ( item, options ) {

	switch ( item.type ) {

	case 'walls':
		return getWalls( item, options );

	case 'lines':
		return getLines( item, options );

	default:
		console.error( 'unknown item type', item.type, ' requested' );

	}

}

function getCommonGeometry ( item, options ) {

	const geometry = new BufferGeometry();

	const indices = item.index.array;
	const vertices = item.position.array;

	if ( options.rotate ) rotateAxes( vertices );

	const index = indices instanceof Uint16Array ?
		new Uint16BufferAttribute( indices, 1 ) :
		new Uint32BufferAttribute( indices, 1 );

	geometry.setIndex( index );
	geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );

	return geometry;

}

function getWalls ( item, options ) {

	const geometry = getCommonGeometry( item, options );

	const vertices = item.position.array;
	const vertexCount = vertices.length / 3;

	const uvs = new Float32BufferAttribute( vertexCount * 2, 2 );
	const uvBuffer = uvs.array;

	const zz = item.modelLimits.max.z;
	const z2 = 2 * zz;

	for ( let i = 0; i < vertexCount; i++ ) {

		const zOffset = i * 3 + ( options.rotate ? 1 : 2 ); // ( offset of Z value, may be rotated )
		const offset = i * 2;

		const u = 1 - ( vertices[ zOffset ] + zz ) / z2;

		uvBuffer[ offset ] = u;
		uvBuffer[ offset + 1 ] = u;

	}

	geometry.setAttribute( 'uv', uvs );

	// fake an HTMLImage element and use non embed image with data url.
	const material = new MeshStandardMaterial( { map: new Texture( { src: gradient } ) } );

	return new Mesh( geometry, material );

}

function getLines ( item, options ) {

	const geometry = getCommonGeometry( item, options );
	const material = new MeshStandardMaterial();

	return new LineSegments( geometry, material );

}

function rotateAxes ( vertices ) {

	const vertexCount = vertices.length;

	// rotate axes for z up.
	for ( let i = 0; i < vertexCount; i++ ) {

		const v = i * 3;
		const z = vertices[ v + 2 ];

		vertices[ v + 2 ] = -vertices[ v + 1 ]; // z = -y
		vertices[ v + 1 ] = z; // y = z

	}

}