import {
	Vector3, Color, Face3,
	Geometry, BufferGeometry,
	MeshBasicMaterial,
	FaceColors, DoubleSide,
	Mesh
} from '../../../../three.js/src/Three.js';

function EntranceNearPointer () {

	var width = 5;
	var height = 20;

	var geometry = new Geometry();
	var bufferGeometry;
// FIXME - only make the geometry once
	geometry.vertices.push( new Vector3( 0, 0, 0 ) );
	geometry.vertices.push( new Vector3( -width, 0, height ) );
	geometry.vertices.push( new Vector3( width, 0, height ) );
	geometry.vertices.push( new Vector3( 0, -width, height ) );
	geometry.vertices.push( new Vector3( 0,  width, height ) );

	geometry.faces.push( new Face3( 0, 1, 2, new Vector3( 0, 0, 1 ), new Color( 0xff0000 ), 0 ) );
	geometry.faces.push( new Face3( 0, 3, 4, new Vector3( 1, 0, 0 ), new Color( 0xffff00 ), 0 ) );

	bufferGeometry = new BufferGeometry().fromGeometry( geometry );
	bufferGeometry.computeBoundingBox();

	var material = new MeshBasicMaterial( { color: 0xffffff, vertexColors: FaceColors, side: DoubleSide } );

	Mesh.call( this, bufferGeometry, material );

	this.type = "CV.EntranceNearPointer";

};

EntranceNearPointer.prototype = Object.create( Mesh.prototype );

EntranceNearPointer.prototype.constructor = EntranceNearPointer;

export { EntranceNearPointer };

// EOF