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

Walls.prototype.addWalls = function ( vertices, indices, runs ) {

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

	this.userData = { faceRuns: runs };

	return this;

};

Walls.prototype.setShading = function ( selectedRuns, selectedMaterial ) {

	var geometry = this.geometry;

	geometry.clearGroups();

	var vertexCount = geometry.index.count;

	this.material = [ selectedMaterial, unselectedMaterial ];

	var f, l, run;

	var faceRuns = this.userData.faceRuns;

	if ( selectedRuns.size && faceRuns ) {

		for ( run = 0, l = faceRuns.length; run < l; run++ ) {

			var faceRun = faceRuns[ run ];
			var survey  = faceRun.survey;
			var start   = faceRun.start;
			var end     = faceRun.end;

			if ( selectedRuns.has( survey ) ) {

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

	var faceRuns = this.userData.faceRuns;

	var geometry = this.geometry;

	var position = geometry.getAttribute( 'position' );
	var index = geometry.index;

	var newVertices = newGeometry.vertices;

	var newFaceRuns = [];

	var fp = 0;

	var vMap = new Map();
	var face;

	var nextVertex = 0, vertexIndex;

	for ( var run = 0, l = faceRuns.length; run < l; run++ ) {

		var faceRun = faceRuns[ run ];
		var survey  = faceRun.survey;
		var start   = faceRun.start;
		var end     = faceRun.end;

		if ( selectedSectionIds.has( survey ) ) {

			for ( var f = start; f < end; f++ ) {

				face = faces[ f ];

				// remap face vertices into new vertex array
				face.a = _remapVertex( face.a );
				face.b = _remapVertex( face.b );
				face.c = _remapVertex( face.c );

				newFaces.push( face );

			}

			faceRun.start = fp;

			fp += end - start;

			faceRun.end = fp;

			newFaceRuns.push( faceRun );

		}

	}

	if ( newGeometry.vertices.length === 0 ) {

		// this type of leg has no instances in selected section.

		self.layers.mask &= ~ mesh.layers.mask; // remove this from survey layer mask

		cutList.push( mesh );

		return;

	}

	geometry.computeVertexNormals();
	geometry.computeBoundingBox();

	this.userData.faceRuns = newFaceRuns;

	function _remapVertex ( vi ) {

		// see if we have already remapped this vertex index (vi)

		vertexIndex = vMap.get( vi );

		if ( vertexIndex === undefined ) {

			vertexIndex = nextVertex++;

			// insert new index in map
			vMap.set( vi, vertexIndex );

			newVertices.push( vertices[ vi ] );

		}

		return vertexIndex;

	}

};

export { Walls };
