
/**
 * @author Angus Sawyer
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 *
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

import { BufferGeometry, Float32BufferAttribute, Vector3, Box3 } from '../../../../three.js/src/Three';
import { Colours } from '../core/Colours';
import { upAxis } from '../core/constants';

function LoxTerrainGeometry( dtm, offsets ) {

	BufferGeometry.call( this );

	this.type = 'LoxTerrainGeometry';

	var heightData = dtm.data;

	var ix, iy, i, l, x, y, z;

	// buffers

	var indices = [];
	var vertices = [];

	var minZ = Infinity;
	var maxZ = -Infinity;

	// generate vertices

	var zIndex = 0;

	var lines = dtm.lines;
	var samples = dtm.samples;

	var vertexCount = lines * samples;

	// 2 x 2 scale & rotate callibration matrix

	var xx  = dtm.xx;
	var xy  = dtm.xy;
	var yx  = dtm.yx;
	var yy  = dtm.yy;

	// offsets from dtm -> survey -> model

	var xOffset = dtm.xOrigin - offsets.x;
	var yOffset = dtm.yOrigin - offsets.y;
	var zOffset =             - offsets.z;

//	var x, y, z;

	var lx = samples - 1;
	var ly = lines - 1;

	for ( iy = 0; iy < lines; iy++ ) {

		for ( ix = 0; ix < samples; ix++ ) {

			z = heightData[ zIndex++ ];

			x = ix * xx + ( ly - iy ) * xy + xOffset;
			y = ix * yx + ( ly - iy ) * yy + yOffset;
			z += zOffset;

			vertices.push( x, y, z );

			if ( z < minZ ) minZ = z;
			if ( z > maxZ ) maxZ = z;

		}

	}

	var maxX = lx * xx + ly * xy + xOffset;
	var maxY = lx * yx + ly * yy + yOffset;

	this.boundingBox = new Box3( new Vector3( xOffset, yOffset, minZ ), new Vector3( maxX, maxY, maxZ ) );

	// indices

	for ( iy = 0; iy < ly; iy ++ ) {

		for ( ix = 0; ix < lx; ix ++ ) {

			var a = ix + samples * iy;
			var b = ix + samples * ( iy + 1 );
			var c = ( ix + 1 ) + samples * ( iy + 1 );
			var d = ( ix + 1 ) + samples * iy;

			// faces - render each quad such that the shared diagonal edge has the minimum length - gives a smother terrain surface
			// diagonals b - d, a - c

			var d1 = Math.abs( vertices[ a * 3 + 2 ] - vertices[ d * 3 + 2 ] );  // diff in Z values between diagonal vertices
			var d2 = Math.abs( vertices[ b * 3 + 2 ] - vertices[ c * 3 + 2 ] );  // diff in Z values between diagonal vertices

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

	var colourScale = Colours.terrain;
	var colourRange = colourScale.length - 1;

	var colourIndex;
	var dotProduct;

	var normal = this.getAttribute( 'normal' );
	var vNormal = new Vector3();

	var buffer = new Float32Array( vertexCount * 3 );
	var colours = [];
	var colour;

	// convert scale to float values

	for ( i = 0, l = colourScale.length; i < l; i++ ) {

		colour = colourScale[ i ];
		colours.push( [ colour[ 0 ] / 255, colour[ 1 ] / 255, colour[ 2 ] / 255 ] );

	}

	for ( i = 0; i < vertexCount; i++ ) {

		vNormal.fromArray( normal.array, i * 3 );

		dotProduct = vNormal.dot( upAxis );
		colourIndex = Math.floor( colourRange * 2 * Math.acos( Math.abs( dotProduct ) ) / Math.PI );

		colour = colours[ colourIndex ];

		var offset = i * 3;

		buffer[ offset     ] = colour[ 0 ];
		buffer[ offset + 1 ] = colour[ 1 ];
		buffer[ offset + 2 ] = colour[ 2 ];

	}

	this.addAttribute( 'color', new Float32BufferAttribute( buffer, 3 ) );

}

LoxTerrainGeometry.prototype = Object.create( BufferGeometry.prototype );
LoxTerrainGeometry.prototype.constructor = LoxTerrainGeometry;

LoxTerrainGeometry.prototype.setupUVs = function ( bitmap, image, offsets ) {

	var det = bitmap.xx * bitmap.yy - bitmap.xy * bitmap.yx;

	if ( det === 0 ) return false;

	var xx =   bitmap.yy / det;
	var xy = - bitmap.xy / det;
	var yx = - bitmap.yx / det;
	var yy =   bitmap.xx / det;

	var vertices = this.getAttribute( 'position' ).array;

	var width  = image.naturalWidth;
	var height = image.naturalHeight;

	var x, y, u, v;

	var xOffset = - ( xx * bitmap.xOrigin + xy * bitmap.yOrigin );
	var yOffset = - ( yx * bitmap.xOrigin + yy * bitmap.yOrigin );

	var uvs = [];

	for ( var i = 0; i < vertices.length; i += 3 ) {

		x = vertices[ i ]     + offsets.x;
		y = vertices[ i + 1 ] + offsets.y;

		u = ( x * xx + y * xy + xOffset ) / width;
		v = ( x * yx + y * yy + yOffset ) / height;

		uvs.push( u, v );

	}

	var uvAttribute = this.getAttribute( 'uv' );

	if ( uvAttribute !== undefined ) {

		console.alert( 'replacing attribute uv' );

	}

	this.addAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

};

export { LoxTerrainGeometry };
