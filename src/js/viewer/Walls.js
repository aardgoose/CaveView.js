import {
	BufferGeometry, Float32BufferAttribute,
	FaceColors, Mesh,
	MeshLambertMaterial
} from '../../../../three.js/src/Three';

var unselectedMaterial = new MeshLambertMaterial( { color: 0x444444, vertexColors: FaceColors } );


function sortGroups ( a, b ) {

	if ( a.materialIndex !== b.materialIndex ) {

		return a.materialIndex - b.materialIndex;

	} else {

		return a.start - b.start;

	}

}

function mergeGroups ( groups ) {

	var group;
	var lastGroup = groups[ 0 ];
	var groupIndex = 1;

	for ( var i = 1, l = groups.length; i < l; i++ ) {

		group = groups[ i ];

		if ( group.materialIndex === lastGroup.materialIndex && lastGroup.start + lastGroup.count === group.start ) {

			lastGroup.count += group.count;

		} else {

			groups[ groupIndex++ ] = group;
			lastGroup = group;

		}

	}

	groups.length = groupIndex; // truncate

	return groups;

}

function Walls ( layer ) {

	var geometry = new BufferGeometry();

	Mesh.call( this, geometry, unselectedMaterial );

	this.layers.set( layer );
	this.type = 'Walls';

	return this;

}

Walls.prototype = Object.create( Mesh.prototype );

Walls.prototype.constructor = Walls;

Walls.prototype.addWalls = function ( vertices, indices, indexRuns ) {

	var geometry = this.geometry;

	var position = geometry.getAttribute( 'position' );

	if ( position === undefined ) {

		var positions = new Float32BufferAttribute( vertices.length * 3, 3 );

		geometry.addAttribute( 'position', positions.copyVector3sArray( vertices ) );

		geometry.setIndex( indices );

	} else {

		// FIXME: alllocate new buffer of old + new length, adjust indexs and append old data after new data.

		console.error( 'Walls: appending not yet implemented' );

	}
	
	geometry.computeVertexNormals();
	geometry.computeBoundingBox();

	this.indexRuns = indexRuns;

	return this;

};

Walls.prototype.setShading = function ( selectedRuns, selectedMaterial ) {

	var geometry = this.geometry;

	geometry.clearGroups();

	var indexRuns = this.indexRuns;

	if ( selectedRuns.size && indexRuns ) {

		this.material = [ selectedMaterial, unselectedMaterial ];

		for ( var run = 0, l = indexRuns.length; run < l; run++ ) {

			var indexRun = indexRuns[ run ];

			geometry.addGroup( indexRun.start, indexRun.count, selectedRuns.has( indexRun.survey ) ? 0 : 1 );

		}

		geometry.groups = mergeGroups( geometry.groups.sort( sortGroups ) );

	} else {

		this.material = selectedMaterial;

	}

};

Walls.prototype.cutRuns = function ( selectedRuns ) {

	var indexRuns = this.indexRuns;

	var geometry = this.geometry;

	var vertices = geometry.getAttribute( 'position' );
	var indices = geometry.index;

	var newIndices = [];
	var newVertices = [];

	var newIndexRuns = [];

	var fp = 0;

	var vMap = new Map();
	var index, newIndex;
	var newVertexIndex = 0;
	var offset;

	for ( var run = 0, l = indexRuns.length; run < l; run++ ) {

		var indexRun = indexRuns[ run ];

		if ( selectedRuns.has( indexRun.survey ) ) {

			var start = indexRun.start;
			var count = indexRun.count;

			var end = start + count;

			var itemSize = vertices.itemSize;
			var oldVertices = vertices.array;

			for ( var i = start; i < end; i++ ) {

				index = indices.getX( i );

				newIndex = vMap.get( index );

				if ( newIndex === undefined ) {

					newIndex = newVertexIndex++;

					vMap.set( index, newIndex );

					offset = index * itemSize;

					newVertices.push( oldVertices[ offset ], oldVertices[ offset + 1 ], oldVertices[ offset + 2 ] );

				}

				newIndices.push( newIndex );

			}

			indexRun.start = fp;

			fp += count;

			newIndexRuns.push( indexRun );

		}

	}

	if ( newIndices.length === 0 ) return false;

	// replace position and index attributes - dispose of old attributes
	geometry.index.setArray( new indices.array.constructor( newIndices ) );
	geometry.index.needsUpdate = true;

	vertices.setArray( new Float32Array( newVertices ) );
	vertices.needsUpdate = true;

	geometry.computeVertexNormals();
	geometry.computeBoundingBox();

	this.indexRuns = newIndexRuns;

	return true;

};

export { Walls };
