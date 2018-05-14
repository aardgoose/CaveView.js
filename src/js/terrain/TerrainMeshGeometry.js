
/**
 * @author Angus Sawyer
 */

import { BufferGeometry } from '../../../../three.js/src/core/BufferGeometry';
import { Float32BufferAttribute } from '../../../../three.js/src/core/BufferAttribute';
import { Vector3 } from '../../../../three.js/src/math/Vector3';
import { Box3 } from '../../../../three.js/src/math/Box3';

function TerrainMeshGeometry( width, height, meshData, scale, clip, offsets ) {

	BufferGeometry.call( this );

	this.type = 'TerrainMeshGeometry';

	// buffers

	const indices = [];
	const vertices = [];
	const uvs = [];

	const dataView = new DataView( meshData, 0 );

	const centerX = dataView.getFloat64( 0, true );
	const centerY = dataView.getFloat64( 8, true );
	// const centerZ = dataView.getFloat64( 16, true );

	const minZ = dataView.getFloat32( 24, true );
	const maxZ = dataView.getFloat32( 28, true );
	const rangeZ = maxZ - minZ;

	// vertex count
	const vCount = dataView.getUint32( 88, true );

	const uArray = _decode( new Uint16Array( meshData, 92, vCount ) );
	const vArray = _decode( new Uint16Array( meshData, 92 + vCount * 2, vCount ) );
	const hArray = _decode( new Uint16Array( meshData, 92 + vCount * 4, vCount ) );

	var i;

	for ( i = 0; i < vCount; i++ ) {

		const u = uArray[ i ] / 32767;
		const v = vArray[ i ] / 32767;

		vertices.push( u * width + offsets.x );
		vertices.push( v * height + offsets.y );

		vertices.push( hArray[ i ] / 32767 * rangeZ + minZ );

		uvs.push ( u, v );

	}

	const indexDataOffset = 88 + 4 + vCount * 6; // need to fix alignment

	var iSize = vCount > 65536 ? 32: 16;

	const triangleCount = dataView.getUint32( indexDataOffset, true );

	const iArray = new Uint16Array( meshData, indexDataOffset + 4, triangleCount * 3 );

	console.log( 'triangleCount', triangleCount, indexDataOffset, iSize );
	console.log( 'cx cy:', centerX, centerY );
	console.log( 'minz maxz:', minZ, maxZ, vCount );

	var highest = 0;

	for ( i = 0; i < iArray.length; i++ ) {

		const code = iArray[ i ];

		indices[ i ] = highest - code;

		if ( code === 0 ) {

			++highest;

		}

	}

	// avoid overhead of computeBoundingBox since we know x & y min and max values;

	this.boundingBox = new Box3().set( new Vector3( offsets.x, offsets.y - height, minZ ), new Vector3( offsets.x + width, offsets.y, maxZ ) );

	// generate vertices and uvs

	// build geometry

	this.setIndex( indices );
	this.addAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
	this.addAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

	this.computeVertexNormals();

	function _decode( tArray ) {

		tArray.forEach( function ( value, index, array ) {

			array[ index ] = ( value << 1 ) ^ ( - ( value & 1 ) );

		} );

		return tArray;

	}

}

TerrainMeshGeometry.prototype = Object.create( BufferGeometry.prototype );

export { TerrainMeshGeometry };
