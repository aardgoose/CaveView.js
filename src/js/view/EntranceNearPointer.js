
CV.EntranceNearPointer = function () {

	var width = 5;
	var height = 20;

	this.type = "CV.EntranceNearPointer";

	var geometry = new THREE.Geometry();
	var bufferGeometry;

	geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
	geometry.vertices.push( new THREE.Vector3( -width, 0, height ) );
	geometry.vertices.push( new THREE.Vector3( width, 0, height ) );
	geometry.vertices.push( new THREE.Vector3( 0, -width, height ) );
	geometry.vertices.push( new THREE.Vector3( 0,  width, height ) );

	geometry.faces.push( new THREE.Face3( 0, 1, 2, new THREE.Vector3( 0, 0, 1 ), new THREE.Color( 0xff0000 ), 0 ) );
	geometry.faces.push( new THREE.Face3( 0, 3, 4, new THREE.Vector3( 1, 0, 0 ), new THREE.Color( 0xffff00 ), 0 ) );

	bufferGeometry = new THREE.BufferGeometry().fromGeometry( geometry );
	bufferGeometry.computeBoundingBox();

	var material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.DoubleSide } );

	THREE.Mesh.call( this, bufferGeometry, material );

};

CV.EntranceNearPointer.prototype = Object.create( THREE.Mesh.prototype );

CV.EntranceNearPointer.prototype.constructor = CV.EntranceNearPointer;

// EOF