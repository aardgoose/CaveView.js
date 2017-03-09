
/**
 * @author Angus Sawyer
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 *
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

import { Float32BufferAttribute, BufferGeometry, Vector3 } from '../../../../three.js/src/Three';
import { ColourCache } from '../core/ColourCache';
import { upAxis } from '../core/constants';

function TerrainTileGeometry( width, height, widthSegments, heightSegments, terrainData, scale ) {

	BufferGeometry.call( this );

	this.type = 'TerrainTileGeometry';

	var width_half = width / 2;
	var height_half = height / 2;

	var gridX = Math.floor( widthSegments ) || 1;
	var gridY = Math.floor( heightSegments ) || 1;

	var gridX1 = gridX + 1;
	var gridY1 = gridY + 1;

	var segment_width = width / gridX;
	var segment_height = height / gridY;

	var ix, iy, i;

	// buffers

	var indices = [];
	var vertices = [];
	var colours = [];
	var uvs = [];

	var vertexCount = 0;

	// generate vertices and uvs

	for ( iy = 0; iy < gridY1; iy ++ ) {

		var y = iy * segment_height - height_half;

		for ( ix = 0; ix < gridX1; ix ++ ) {

			var x = ix * segment_width - width_half;

			vertices.push( x, - y, terrainData[ vertexCount++ ] / scale );

			uvs.push( ix / gridX );
			uvs.push( 1 - ( iy / gridY ) );

		}

	}

	// indices

	for ( iy = 0; iy < gridY; iy ++ ) {

		for ( ix = 0; ix < gridX; ix ++ ) {

			var a = ix + gridX1 * iy;
			var b = ix + gridX1 * ( iy + 1 );
			var c = ( ix + 1 ) + gridX1 * ( iy + 1 );
			var d = ( ix + 1 ) + gridX1 * iy;

			// faces
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

	var colourCache = ColourCache.terrain;
	var colourRange = colourCache.length - 1;

	var colourIndex;
	var dotProduct;

	var normal = this.getAttribute( 'normal' );
	var vNormal = new Vector3();

	for ( i = 0; i < vertexCount; i++ ) {

		vNormal.fromArray( normal.array, i * 3 );

		dotProduct = vNormal.dot( upAxis );
		colourIndex = Math.floor( colourRange * 2 * Math.acos( Math.abs( dotProduct ) ) / Math.PI );

		colours.push( colourCache[ colourIndex ] );

	}

	this.addAttribute( 'color', new Float32BufferAttribute( vertexCount * 3, 3 ).copyColorsArray( colours ) );

}

TerrainTileGeometry.prototype = Object.create( BufferGeometry.prototype );
TerrainTileGeometry.prototype.constructor = TerrainTileGeometry;

export { TerrainTileGeometry };
