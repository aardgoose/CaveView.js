
/**
 * @author Angus Sawyer
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 *
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

import { BufferGeometry, Float32BufferAttribute, Vector3, Matrix4, Box3 } from '../../../../three.js/src/Three';
import { Colours } from '../core/Colours';
import { upAxis } from '../core/constants';

function LoxTerrainGeometry( dtm ) {

	BufferGeometry.call( this );

	this.type = 'LoxTerrainGeometry';

	console.log( 'dtm', dtm );

	var heightData = dtm.data;

	var ix, iy, i, z, l;

	// buffers

	var indices = [];
	var vertices = [];
	var uvs = [];

	var minZ = Infinity;
	var maxZ = -Infinity;

	// generate vertices and uvs

	var zIndex = 0;

	var x = 0;
	var y = 0;

	var lines = dtm.lines;
	var samples = dtm.samples;

	var vertexCount = lines * samples;

	for ( iy = 0; iy < lines; iy++ ) {

		x = 0;

		for ( ix = 0; ix < samples; ix++ ) {

			z = heightData[ zIndex++ ];

			vertices.push( x, - y, z );

			if ( z < minZ ) minZ = z;
			if ( z > maxZ ) maxZ = z;

			uvs.push( ix / ( samples - 1 ) );
			uvs.push( 1 - iy / ( samples - 1 ) );

		}

	}

	var m = new Matrix4().set(
		dtm.xx, dtm.xy, 0, dtm.xOrigin,
		dtm.yx, dtm.yy, 0, dtm.yOrigin,
		0,      0,      1, 0,
		0,      0,      0, 1
	);

	this.applyMatrix( m );

	// avoid overhead of computeBoundingBox since we know x & y min and max values;

//	this.boundingBox = new Box3().set( new Vector3( 0, 0, minZ ), new Vector3( width, -height, maxZ ) );
	this.computeBoundingBox();

	// indices

	for ( iy = 0; iy < lines; iy ++ ) {

		for ( ix = 0; ix < samples; ix ++ ) {

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
	this.addAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

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
		console.log( colourIndex, colour );
		var offset = i * 3;

		buffer[ offset     ] = colour[ 0 ];
		buffer[ offset + 1 ] = colour[ 1 ];
		buffer[ offset + 2 ] = colour[ 2 ];

	}

	this.addAttribute( 'color', new Float32BufferAttribute( buffer, 3 ) );

}

LoxTerrainGeometry.prototype = Object.create( BufferGeometry.prototype );
LoxTerrainGeometry.prototype.constructor = LoxTerrainGeometry;

export { LoxTerrainGeometry };
