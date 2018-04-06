
/**
 * @author Angus Sawyer
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 *
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

import { BufferGeometry, Float32BufferAttribute, Vector3, Box3 } from '../Three';

function LoxTerrainGeometry( dtm, offsets ) {

	BufferGeometry.call( this );

	this.type = 'LoxTerrainGeometry';

	const heightData = dtm.data;

	const lines = dtm.lines;
	const samples = dtm.samples;

	// buffers

	const indices = [];
	const vertices = [];

	// 2 x 2 scale & rotate callibration matrix

	const xx = dtm.xx;
	const xy = dtm.xy;
	const yx = dtm.yx;
	const yy = dtm.yy;

	// offsets from dtm -> survey -> model

	const xOffset = dtm.xOrigin - offsets.x;
	const yOffset = dtm.yOrigin - offsets.y;
	const zOffset =             - offsets.z;

	const lx = samples - 1;
	const ly = lines - 1;

	var ix, iy;

	var minZ = Infinity;
	var maxZ = -Infinity;

	var zIndex = 0;

	// setup vertices frmo height data (corrected by rotation matrix)

	for ( iy = 0; iy < lines; iy++ ) {

		for ( ix = 0; ix < samples; ix++ ) {

			const x = ix * xx + ( ly - iy ) * xy + xOffset;
			const y = ix * yx + ( ly - iy ) * yy + yOffset;

			const z = heightData[ zIndex++ ] + zOffset;

			vertices.push( x, y, z );

			if ( z < minZ ) minZ = z;
			if ( z > maxZ ) maxZ = z;

		}

	}

	const maxX = lx * xx + ly * xy + xOffset;
	const maxY = lx * yx + ly * yy + yOffset;

	this.boundingBox = new Box3( new Vector3( xOffset, yOffset, minZ ), new Vector3( maxX, maxY, maxZ ) );

	// indices

	for ( iy = 0; iy < ly; iy ++ ) {

		for ( ix = 0; ix < lx; ix ++ ) {

			const a = ix + samples * iy;
			const b = ix + samples * ( iy + 1 );
			const c = ( ix + 1 ) + samples * ( iy + 1 );
			const d = ( ix + 1 ) + samples * iy;

			// faces - render each quad such that the shared diagonal edge has the minimum length - gives a smother terrain surface
			// diagonals b - d, a - c

			const d1 = Math.abs( vertices[ a * 3 + 2 ] - vertices[ d * 3 + 2 ] ); // diff in Z values between diagonal vertices
			const d2 = Math.abs( vertices[ b * 3 + 2 ] - vertices[ c * 3 + 2 ] ); // diff in Z values between diagonal vertices

			if ( d1 < d2 ) {

				indices.push( a, b, d );
				indices.push( b, c, d );

			} else {

				indices.push( a, b, c );
				indices.push( c, d, a );

			}

		}

	}

	// build geometry

	this.setIndex( indices );
	this.addAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );

	// calibration data from terrain and local survey -> model - offsets

	this.computeVertexNormals();

}

LoxTerrainGeometry.prototype = Object.create( BufferGeometry.prototype );

LoxTerrainGeometry.prototype.setupUVs = function ( bitmap, image, offsets ) {

	const det = bitmap.xx * bitmap.yy - bitmap.xy * bitmap.yx;

	if ( det === 0 ) return false;

	// rotation matrix of bitmap over CRS
	const xx =   bitmap.yy / det;
	const xy = - bitmap.xy / det;
	const yx = - bitmap.yx / det;
	const yy =   bitmap.xx / det;

	const vertices = this.getAttribute( 'position' ).array;

	const width  = image.naturalWidth;
	const height = image.naturalHeight;

	const xOffset = - ( xx * bitmap.xOrigin + xy * bitmap.yOrigin );
	const yOffset = - ( yx * bitmap.xOrigin + yy * bitmap.yOrigin );

	const uvs = [];

	for ( var i = 0; i < vertices.length; i += 3 ) {

		const x = vertices[ i ]     + offsets.x;
		const y = vertices[ i + 1 ] + offsets.y;

		const u = ( x * xx + y * xy + xOffset ) / width;
		const v = ( x * yx + y * yy + yOffset ) / height;

		uvs.push( u, v );

	}

	const uvAttribute = this.getAttribute( 'uv' );

	if ( uvAttribute !== undefined ) {

		console.alert( 'replacing attribute uv' );

	}

	this.addAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

};

export { LoxTerrainGeometry };
