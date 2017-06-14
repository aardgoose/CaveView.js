import {
	BufferGeometry, Float32BufferAttribute,
	FaceColors, Mesh,
	MeshLambertMaterial
} from '../../../../three.js/src/Three';

var unselectedMaterial = new MeshLambertMaterial( { color: 0x444444, vertexColors: FaceColors } );

function Walls ( layer ) {

	var geometry = new BufferGeometry();

	Mesh.call( this, geometry, unselectedMaterial );

	this.layers.set( layer );
	this.visible = true;

	return this;

}

Walls.prototype = Object.create( Mesh.prototype );

Walls.prototype.constructor = Walls;

Walls.prototype.addWalls = function ( vertices, indices, indexRuns ) {

	var geometry = this.geometry; // FIXME handle adding new bits

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

	var vertexCount = geometry.index.count;

	this.material = [ selectedMaterial, unselectedMaterial ];

	var indexRuns = this.indexRuns;

	if ( selectedRuns.size && indexRuns ) {

		for ( var run = 0, l = indexRuns.length; run < l; run++ ) {

			var indexRun = indexRuns[ run ];

			var start = indexRun.start;
			var end   = indexRun.end;

			if ( selectedRuns.has( indexRun.survey ) ) {

				geometry.addGroup( start * 3, ( end - start ) * 3, 0 );

			} else {

				geometry.addGroup( start * 3, ( end - start ) * 3, 1 );

			}

		}

	} else {

		geometry.addGroup( 0, vertexCount, 0 );

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

	for ( var run = 0, l = indexRuns.length; run < l; run++ ) {

		var indexRun = indexRuns[ run ];

		if ( selectedRuns.has( indexRun.survey ) ) {

			var start = indexRun.start;
			var end   = indexRun.end;

			for ( var i = start; i < end; i++ ) {

				index = indices.getX( i );

				newIndex = vMap.get( index );

				if ( newIndex === undefined ) {

					newIndex = newVertices.length;

					vMap.set( index, newIndex );

//					newVertices.push( vertices.getX[ index ] ); // needs fixing up - copy vertex (3)

				}

				newIndices.push( newIndex );

			}

			indexRun.start = fp;

			fp += end - start;

			indexRun.end = fp;

			newIndexRuns.push( indexRun );

		}

	}

/*
	if ( newGeometry.vertices.length === 0 ) {

		// this type of leg has no instances in selected section.

		self.layers.mask &= ~ mesh.layers.mask; // remove this from survey layer mask

		cutList.push( mesh );

		return;

	}
*/

	geometry.computeVertexNormals();
	geometry.computeBoundingBox();

	this.userData.faceRuns = newIndexRuns;

};

export { Walls };
