
/**
 * @author Angus Sawyer
 */

import { BufferGeometry } from '../../../../three.js/src/core/BufferGeometry';
import { Float32BufferAttribute } from '../../../../three.js/src/core/BufferAttribute';
import { Vector3 } from '../../../../three.js/src/math/Vector3';
import { Quaternion } from '../../../../three.js/src/math/Quaternion';

function TerrainMeshGeometry( x, y, resolution, meshData, offsets, transform ) {

	BufferGeometry.call( this );

	this.type = 'TerrainMeshGeometry';

	// buffers

	const indices = [];
	const vertices = [];
	const uvs = [];
	const normals = [];

	const dataView = new DataView( meshData, 0 );

	const centerX = dataView.getFloat64( 0, true );
	const centerY = dataView.getFloat64( 8, true );
	const centerZ = dataView.getFloat64( 16, true );

	const up = new Vector3( centerX, centerY, centerZ ).normalize();

	const quaternion = new Quaternion().setFromUnitVectors( up, new Vector3( 0, 0, 1 ) );

	const minZ = dataView.getFloat32( 24, true );
	const maxZ = dataView.getFloat32( 28, true );
	const rangeZ = maxZ - minZ;

	// vertex count
	const vCount = dataView.getUint32( 88, true );

	const uArray = _decode( new Uint16Array( meshData, 92, vCount ) );
	const vArray = _decode( new Uint16Array( meshData, 92 + vCount * 2, vCount ) );
	const hArray = _decode( new Uint16Array( meshData, 92 + vCount * 4, vCount ) );

	const offsetX = - offsets.x;
	const offsetY = - offsets.y;
	const offsetZ = minZ - offsets.z;

	var i;
	var v3 = new Vector3(); // tmp for normal decoding

	// generate vertices and uvs

	for ( i = 0; i < vCount; i++ ) {

		const u = uArray[ i ] / 32767;
		const v = vArray[ i ] / 32767;

		const coords = transform.forward( { x: x + u * resolution, y: y + v * resolution } );

		vertices.push( coords.x + offsetX );
		vertices.push( coords.y + offsetY );

		vertices.push( hArray[ i ] / 32767 * rangeZ + offsetZ );

		uvs.push ( u, v );

	}

	const indexDataOffset = 88 + 4 + vCount * 6; // need to fix alignment

	var indexElementSize = vCount > 65536 ? 4: 2;

	const triangleCount = dataView.getUint32( indexDataOffset, true );

	const iArray = new Uint16Array( meshData, indexDataOffset + 4, triangleCount * 3 );

	var highest = 0;

	for ( i = 0; i < iArray.length; i++ ) {

		const code = iArray[ i ];

		indices[ i ] = highest - code;

		if ( code === 0 ) {

			++highest;

		}

	}

	var nextStart = indexDataOffset + 4 + ( triangleCount * 3 * indexElementSize );

	// skip edge vertex descriptors

	for ( i = 0; i < 4; i++ ) {

		const edgeVertexCount = dataView.getInt32( nextStart, true );

		nextStart += 4 + edgeVertexCount * indexElementSize;

	}

	/*

	const extentionId = dataView.getUint8( nextStart, true );
	const extentionLength = dataView.getUint32( nextStart + 1, true );

	*/

	// read oct encoded normals

	const octNormals = new Uint8Array( meshData, nextStart + 5, vCount * 2 );

	for ( i = 0; i < vCount * 2; ) {

		_decodeOct( ( octNormals[ i++ ] / 255 ) * 2 - 1, ( octNormals[ i++ ] / 255 ) * 2 - 1 );

	}

	// build geometry

	this.setIndex( indices );

	this.addAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
	this.addAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );

	this.addAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

	this.computeBoundingBox();
	//this.computeVertexNormals();

	function _decode( tArray ) {

		// zig zag and delta decode
		var value = 0;

		tArray.forEach( function ( deltaValue, index, array ) {

			value += ( deltaValue >> 1 ) ^ ( - ( deltaValue & 1 ) );
			array[ index ] = value;

		} );

		return tArray;

	}

	function _decodeOct ( xOct, yOct ) {

		v3.x = xOct;
		v3.y = yOct;
		v3.z = 1 - ( Math.abs( xOct ) + Math.abs( yOct ) );

		if ( v3.z < 0) {

			const x = v3.x;

			v3.x = ( 1.0 - Math.abs( v3.y ) ) * _signNotZero( x );
			v3.y = ( 1.0 - Math.abs( x ) ) * _signNotZero( v3.y );

		}

		// approximate transformation from ECRF to local refrence frame
		v3.applyQuaternion( quaternion );
		v3.normalize();

		normals.push( v3.y, v3.x, v3.z );

	}

	function _signNotZero ( value ) {

		return value < 0.0 ? -1.0 : 1.0;

	}

}

TerrainMeshGeometry.prototype = Object.create( BufferGeometry.prototype );

export { TerrainMeshGeometry };
