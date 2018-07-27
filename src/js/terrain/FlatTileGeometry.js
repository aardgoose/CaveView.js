
/**
 * @author Angus Sawyer
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 *
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

import { BufferGeometry } from 'three/src/core/BufferGeometry';
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute';
import { Vector3 } from 'three/src/math/Vector3';
import { Box3 } from 'three/src/math/Box3';

function FlatTileGeometry( width, height, clip, offsets, flatZ ) {

	BufferGeometry.call( this );

	this.type = 'FlatTileGeometry';

	// buffers

	const vertices = [];
	const uvs = [];

	// generate vertices and uvs

	vertices.push( offsets.x,         offsets.y - height, flatZ );
	vertices.push( offsets.x,         offsets.y, flatZ );
	vertices.push( offsets.x + width, offsets.y, flatZ );
	vertices.push( offsets.x + width, offsets.y - height, flatZ );

	uvs.push( clip.left / clip.terrainWidth,          clip.bottom / clip.terrainHeight );
	uvs.push( clip.left / clip.terrainWidth,          1 - ( clip.top / clip.terrainHeight ) );
	uvs.push( 1 - ( clip.right / clip.terrainWidth ), 1 - ( clip.top / clip.terrainHeight ) );
	uvs.push( 1 - ( clip.right / clip.terrainWidth ), clip.bottom / clip.terrainHeight );

	// avoid overhead of computeBoundingBox since we know x & y min and max values;

	this.boundingBox = new Box3().set( new Vector3( offsets.x, offsets.y - height, 0 ), new Vector3( offsets.x + width, offsets.y, 0 ) );

	// build geometry

	this.setIndex( [ 0, 2, 1, 0, 3, 2 ] );
	this.addAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
	this.addAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

	this.computeVertexNormals();

}

FlatTileGeometry.prototype = Object.create( BufferGeometry.prototype );

export { FlatTileGeometry };
