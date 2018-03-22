import {
	BufferGeometry, Float32BufferAttribute,
	FaceColors, Mesh,
	MeshLambertMaterial
} from '../Three';

import { StencilLib } from '../core/StencilLib';

const unselectedMaterial = new MeshLambertMaterial( { color: 0x444444, vertexColors: FaceColors } );

function Walls () {

	const geometry = new BufferGeometry();

	Mesh.call( this, geometry, unselectedMaterial );

	this.type = 'Walls';

	return this;

}

Walls.prototype = Object.create( Mesh.prototype );

Walls.prototype.onBeforeRender = StencilLib.featureOnBeforeRender;
Walls.prototype.onAfterRender = StencilLib.featureOnAfterRender;

Walls.prototype.addWalls = function ( vertices, indices, indexRuns ) {

	const geometry = this.geometry;
	const position = geometry.getAttribute( 'position' );

	if ( position === undefined ) {

		const positions = new Float32BufferAttribute( vertices.length * 3, 3 );

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

	const geometry = this.geometry;
	const indexRuns = this.indexRuns;

	geometry.clearGroups();

	if ( selectedRuns.size && indexRuns ) {

		this.material = [ selectedMaterial, unselectedMaterial ];

		let indexRun = indexRuns[ 0 ];

		let start = indexRun.start;
		let count = indexRun.count;

		let currentMaterial;
		let lastMaterial = selectedRuns.has( indexRun.survey ) ? 0 : 1;

		// merge adjacent runs with shared material.

		for ( var run = 1, l = indexRuns.length; run < l; run++ ) {

			indexRun = indexRuns[ run ];

			currentMaterial = selectedRuns.has( indexRun.survey ) ? 0 : 1;

			if ( currentMaterial === lastMaterial && indexRun.start === start + count ) {

				count += indexRun.count;

			} else {

				geometry.addGroup( start, count, lastMaterial );

				start = indexRun.start;
				count = indexRun.count;

				lastMaterial = currentMaterial;

			}

		}

		geometry.addGroup( start, count, lastMaterial );

	} else {

		this.material = selectedMaterial;

	}

};

Walls.prototype.cutRuns = function ( selectedRuns ) {

	const geometry = this.geometry;

	const vertices = geometry.getAttribute( 'position' );
	const indices = geometry.index;

	const indexRuns = this.indexRuns;

	const newIndices = [];
	const newVertices = [];

	const newIndexRuns = [];

	// map old vertex index values to new index values
	const vMap = new Map();

	const l = indexRuns.length;
	var run;

	for ( run = 0; run < l; run++ ) {

		const indexRun = indexRuns[ run ];

		let i, newVertexIndex = 0, fp = 0;

		if ( selectedRuns.has( indexRun.survey ) ) {

			const start = indexRun.start;
			const count = indexRun.count;

			const end = start + count;

			const itemSize = vertices.itemSize;
			const oldVertices = vertices.array;

			for ( i = start; i < end; i++ ) {

				const index = indices.getX( i );

				let newIndex = vMap.get( index );

				if ( newIndex === undefined ) {

					const offset = index * itemSize;

					newIndex = newVertexIndex++;

					vMap.set( index, newIndex );

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
