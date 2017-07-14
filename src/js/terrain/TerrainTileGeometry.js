
/**
 * @author Angus Sawyer
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 *
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

import { BufferGeometry } from '../../../../three.js/src/core/BufferGeometry';
import { Float32BufferAttribute } from '../../../../three.js/src/core/BufferAttribute';
import { Vector3 } from '../../../../three.js/src/math/Vector3';
import { Box3 } from '../../../../three.js/src/math/Box3';

import { Colours } from '../core/Colours';
import { upAxis } from '../core/constants';

function TerrainTileGeometry( width, height, widthSegments, heightSegments, terrainData, scale, clip, zOffset ) {

	BufferGeometry.call( this );

	this.type = 'TerrainTileGeometry';

	var gridX = Math.floor( widthSegments ) || 1;
	var gridY = Math.floor( heightSegments ) || 1;

	var gridX1 = gridX + 1;
	var gridY1 = gridY + 1;

	var segment_width = width / gridX;
	var segment_height = height / gridY;

	var ix, iy, i, z, l;

	// buffers

	var indices = [];
	var vertices = [];
	var uvs = [];

	var vertexCount = 0;

	var minZ = Infinity;
	var maxZ = -Infinity;

	// generate vertices and uvs

	var zIndex;

	var x = 0;
	var y = 0;

	if ( clip.terrainWidth === undefined ) {

		clip.terrainWidth  = gridX;
		clip.terrainHeight = gridY;

	}

	if ( clip.dtmWidth === undefined ) {

		clip.dtmWidth = clip.terrainWidth + 1;

	}

	var ixMax = gridX1 + clip.left;
	var iyMax = gridY1 + clip.top;

	for ( iy = clip.top; iy < iyMax; iy++ ) {

		x = 0;

		// dtmOffset adjusts for tiles smaller than DTM height maps

		zIndex = iy * clip.dtmWidth + clip.left + clip.dtmOffset; 

		for ( ix = clip.left; ix < ixMax; ix++ ) {

			z = terrainData[ zIndex++ ] / scale - zOffset; // scale and convert to origin centered coords

			vertices.push( x, - y, z );
			vertexCount++;

			if ( z < minZ ) minZ = z;
			if ( z > maxZ ) maxZ = z;

			uvs.push( ix / clip.terrainWidth );
			uvs.push( 1 - ( iy / clip.terrainHeight ) );

			x += segment_width;

		}

		y += segment_height;

	}

	// avoid overhead of computeBoundingBox since we know x & y min and max values;

	this.boundingBox = new Box3().set( new Vector3( 0, 0, minZ ), new Vector3( width, -height, maxZ ) );

	// indices

	for ( iy = 0; iy < gridY; iy ++ ) {

		for ( ix = 0; ix < gridX; ix ++ ) {

			var a = ix + gridX1 * iy;
			var b = ix + gridX1 * ( iy + 1 );
			var c = ( ix + 1 ) + gridX1 * ( iy + 1 );
			var d = ( ix + 1 ) + gridX1 * iy;

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
		var offset = i * 3;

		buffer[ offset     ] = colour[ 0 ];
		buffer[ offset + 1 ] = colour[ 1 ];
		buffer[ offset + 2 ] = colour[ 2 ];

	}

	this.addAttribute( 'color', new Float32BufferAttribute( buffer, 3 ) );

}

TerrainTileGeometry.prototype = Object.create( BufferGeometry.prototype );
TerrainTileGeometry.prototype.constructor = TerrainTileGeometry;

export { TerrainTileGeometry };
