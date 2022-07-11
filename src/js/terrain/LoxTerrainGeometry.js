/**
 * @author Angus Sawyer
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 *
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

import { Box3, BufferGeometry, Float32BufferAttribute, Vector3 } from '../Three';

class LoxTerrainGeometry extends BufferGeometry {

	constructor ( dtm, offsets ) {

		super();

		this.type = 'LoxTerrainGeometry';

		const heightData = dtm.data;

		const lines = dtm.lines;
		const samples = dtm.samples;
		const calib = dtm.calib;

		// buffers

		const indices = [];
		const vertices = [];

		// 2 x 2 scale & rotate callibration matrix

		const xx = calib.xx;
		const xy = calib.xy;
		const yx = calib.yx;
		const yy = calib.yy;

		// offsets from dtm -> survey -> model

		const xOffset = calib.xOrigin - offsets.x;
		const yOffset = calib.yOrigin - offsets.y;
		const zOffset = - offsets.z;

		const lx = samples - 1;
		const ly = lines - 1;

		let minZ = Infinity;
		let maxZ = -Infinity;

		// setup vertices from height data (corrected by rotation matrix)
		// y coordinates inverted in .lox datm data

		for ( let iy = 0; iy < lines; iy++ ) {

			const dstOffset = ( lines - 1 - iy ) * samples;

			for ( let ix = 0; ix < samples; ix++ ) {

				const x = ix * xx + ( ly - iy ) * xy + xOffset;
				const y = ix * yx + ( ly - iy ) * yy + yOffset;

				const z = heightData[ dstOffset + ix ] + zOffset;

				vertices.push( x, y, z );

				if ( z < minZ ) minZ = z;
				if ( z > maxZ ) maxZ = z;

			}

		}

		const maxX = lx * xx + ly * xy + xOffset;
		const maxY = lx * yx + ly * yy + yOffset;

		this.boundingBox = new Box3( new Vector3( xOffset, yOffset, minZ ), new Vector3( maxX, maxY, maxZ ) );

		// indices

		for ( let iy = 0; iy < ly; iy ++ ) {

			for ( let ix = 0; ix < lx; ix ++ ) {

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
		this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );

		// calibration data from terrain and local survey -> model - offsets

		this.computeVertexNormals();

	}

	setupUVs ( bitmap, image, offsets ) {

		const calib = bitmap.calib;
		const det = calib.xx * calib.yy - calib.xy * calib.yx;

		if ( det === 0 ) return false;

		// rotation matrix of bitmap over CRS
		const xx =   calib.yy / det;
		const xy = - calib.xy / det;
		const yx = - calib.yx / det;
		const yy =   calib.xx / det;

		const vertices = this.getAttribute( 'position' ).array;

		const width  = image.naturalWidth;
		const height = image.naturalHeight;

		const xOffset = - ( xx * calib.xOrigin + xy * calib.yOrigin );
		const yOffset = - ( yx * calib.xOrigin + yy * calib.yOrigin );

		const uvs = [];

		for ( let i = 0; i < vertices.length; i += 3 ) {

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

		this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

	}

}

export { LoxTerrainGeometry };