

function RectangleGeometry ( box, z ) {

	THREE.Geometry.call( this );

	this.type = "CV.RectangleGeometry";

	var min = box.min;
	var max = box.max;

	this.vertices.push( new THREE.Vector3( min.x, min.y, z ) );
	this.vertices.push( new THREE.Vector3( min.x, max.y, z ) );
	this.vertices.push( new THREE.Vector3( max.x, max.y, z ) );
	this.vertices.push( new THREE.Vector3( max.x, min.y, z ) );
	this.vertices.push( new THREE.Vector3( min.x, min.y, z ) );

};

RectangleGeometry.prototype = Object.create( THREE.Geometry.prototype );

RectangleGeometry.prototype.constructor = RectangleGeometry;

export { RectangleGeometry };

// EOF