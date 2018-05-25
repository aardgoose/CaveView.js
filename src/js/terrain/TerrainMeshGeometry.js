
/**
 * @author Angus Sawyer
 */

import { BufferGeometry } from '../../../../three.js/src/core/BufferGeometry';
import { Float32BufferAttribute } from '../../../../three.js/src/core/BufferAttribute';
import { Vector3 } from '../../../../three.js/src/math/Vector3';
import { Quaternion } from '../../../../three.js/src/math/Quaternion';

function TerrainMeshGeometry( x, y, resolution, meshData, offsets, transform, clip ) {

	BufferGeometry.call( this );

	this.type = 'TerrainMeshGeometry';

	// buffers

	const indices = [];
	const vertices = [];
	const uvs = [];
	const normals = [];
	const clippedVertices = [];
	const vertex3cache = [];

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

		if ( ! clip.containsPoint( coords ) ) clippedVertices[ i ] = true;

		vertices.push( coords.x + offsetX, coords.y + offsetY, hArray[ i ] / 32767 * rangeZ + offsetZ );

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

	var newIndices = [];

	if ( clippedVertices.length === 0 ) {

		// console.log( 'not clipping tile' );
		newIndices = indices;

	} else {

		// console.log( 'clipping tile' );
		_clipEdges();

	}

	// build geometry

	this.setIndex( newIndices );

	this.addAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
	this.addAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );

	this.addAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

	this.computeBoundingBox();

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

	function _handleOverlap1 ( i1, i2, i3 ) {

		const v1 = _getVertex( i1 );
		const v2 = _getVertex( i2 );
		const v3 = _getVertex( i3 );

		//return;

		var p1, p2, p3;

		// p1 - outside point

		if ( v1.outside ) { p1 = v1, p2 = v2, p3 = v3; }
		if ( v2.outside ) { p1 = v2, p2 = v3, p3 = v1; }
		if ( v3.outside ) { p1 = v3, p2 = v1, p3 = v2; }

		if ( p1 === undefined ) console.log( 'already done' );

		// create new vertices which are where p1>p2 and p1>p3 intersect boundary
		// _intersect returns index value

		var i1n2 = _intersect( p1, p2 );
		var i1n3 = _intersect( p1, p3 );

		var common = new Vector3().addVectors( p2, p3 ).divideScalar( 2 );

		var iCommon = vertices.length / 3;

		vertices.push( common.x, common.y, common.z );
		normals.push( 0, 0, 1 );
		uvs.push( 0.5, 0.5 );

		newIndices.push( i1n3, i1n2, iCommon );
		newIndices.push( p2.indexV, iCommon, i1n2 );
		newIndices.push( p3.indexV, i1n3, iCommon );

	}


	function _handleOverlap2 ( i1, i2, i3 ) {

		// newIndices.push( i1, i2, i3 );

		const v1 = _getVertex( i1 );
		const v2 = _getVertex( i2 );
		const v3 = _getVertex( i3 );

		// console.log( 'doing:', i1, i2, i3, v1.outside, v2.outside, v3.outside );

		var p1, p2, p3;

		// p1 - inside point

		if ( ! v1.outside ) { p1 = v1, p2 = v2, p3 = v3; }
		if ( ! v2.outside ) { p1 = v2, p2 = v3, p3 = v1; }
		if ( ! v3.outside ) { p1 = v3, p2 = v1, p3 = v2; }

		const i2n1 = _intersect( p2, p1 );
		const i3n1 = _intersect( p3, p1 );

		newIndices.push( i2n1, i3n1, p1.indexV );

	}

	function _getVertex ( i ) {

		var v = vertex3cache[ i ];

		if ( v !== undefined ) return v;

		let offset = i * 3;

		v = new Vector3( vertices[ offset ], vertices[ offset + 1 ], vertices[ offset + 2 ] );

		v.indexV = i;

		if ( clippedVertices[ i ] ) v.outside = true;

		vertex3cache[ i ] = v;

		return v;

	}

	function _intersect ( v1, v2 ) {

		// y = ax + b;
		// y = (x - b) / a

		const a = ( v1.y - v2.y ) / ( v1.x - v2.x );
		const b = v1.y - a * v1.x;

		var nx, ny, nz;
		var side = 0;

		if ( v1.x < clip.min.x ) {

			const y = a * clip.min.x + b;

			if ( y >= clip.min.y && y <= clip.max.y ) {

				nx = clip.min.x;
				ny = y;
				side = 0x01;

			}

		}

		if ( v1.x > clip.max.x ) {

			const y = a * clip.max.x + b;

			if ( y >= clip.min.y && y <= clip.max.y ) {

				nx = clip.max.x;
				ny = y;
				side = 0x02;

			}

		}

		if ( side === 0 && v1.y <= clip.min.y ) {

			ny = clip.min.y;
			nx = ( ny - b ) / a;
			side = 0x04;

		}

		if ( side === 0 && v1.y >= clip.max.y ) {

			ny = clip.max.y;
			nx = ( ny - b ) / a;
			side = 0x08;

		}

		const dOriginal = Math.sqrt( Math.pow( v1.x - v2.x, 2 ) + Math.pow( v1.y - v2.y, 2 ) );

		const dNew = Math.sqrt( Math.pow( nx - v2.x, 2 ) + Math.pow( ny - v2.y, 2 ) );

		nz = v2.z + ( v1.z - v2.z ) * dNew / dOriginal;

		var newIndex = vertices.length / 3;

		vertices.push( nx, ny, nz );
		normals.push( 0, 0, 1 ); // FIXME correct normals and uvs (lerp)
		uvs.push( 0.5, 0.5 );

		// console.log( side, a );

		return newIndex;

	}

	function _clipEdges () {

		// adjust clip box to model space

		clip.min.sub( offsets );
		clip.max.sub( offsets );

		for ( i = 0; i < indices.length; ) {

			const i1 = indices[ i++ ];
			const i2 = indices[ i++ ];
			const i3 = indices[ i++ ];

			let outside = 0;

			if ( clippedVertices[ i1 ] ) outside++;
			if ( clippedVertices[ i2 ] ) outside++;
			if ( clippedVertices[ i3 ] ) outside++;

			//console.log( i1, i2, i3 );

			switch ( outside ) {

			case 3:

				// skip this tri - totally outside area of interest

				break;

			case 2:

				// handle tri with one point inside area of interest
				// two edge reduced to intersect sides of area

				_handleOverlap2( i1, i2, i3 );

				break;

			case 1:

				// handle tris with one point outside area of interest

				_handleOverlap1( i1, i2, i3, i - 3 );

				break;

			case 0:

				// tri within area of interest

				newIndices.push( i1, i2, i3 );

			}


		}

		return;

	}

}


TerrainMeshGeometry.prototype = Object.create( BufferGeometry.prototype );

export { TerrainMeshGeometry };
