

CV.BoundingBoxGeometry = function ( box ) {

	THREE.Geometry.call( this );

	this.type = "CV.BoundingBoxGeometry";

	var x = box.x / 2;
	var y = box.y / 2;
	var z = box.z / 2;

	this.vertices.push( new THREE.Vector3( -x, -y, -z ) );
	this.vertices.push( new THREE.Vector3(  x, -y, -z ) );
	
	this.vertices.push( new THREE.Vector3(  x, -y, -z ) );
	this.vertices.push( new THREE.Vector3(  x,  y, -z ) );

	this.vertices.push( new THREE.Vector3(  x,  y, -z ) );
	this.vertices.push( new THREE.Vector3( -x,  y, -z ) );

	this.vertices.push( new THREE.Vector3( -x,  y, -z ) );
	this.vertices.push( new THREE.Vector3( -x, -y, -z ) );

	this.vertices.push( new THREE.Vector3(  x,  y, z ) );
	this.vertices.push( new THREE.Vector3(  x, -y, z ) );
	
	this.vertices.push( new THREE.Vector3(  x, -y,  z ) );
	this.vertices.push( new THREE.Vector3( -x, -y,  z ) );

	this.vertices.push( new THREE.Vector3( -x, -y,  z ) );
	this.vertices.push( new THREE.Vector3( -x,  y,  z ) );

	this.vertices.push( new THREE.Vector3( -x,  y,  z ) );
	this.vertices.push( new THREE.Vector3(  x,  y,  z ) );

	this.vertices.push( new THREE.Vector3( -x, -y, -z ) );
	this.vertices.push( new THREE.Vector3( -x, -y,  z ) );

	this.vertices.push( new THREE.Vector3( -x,  y, -z ) );
	this.vertices.push( new THREE.Vector3( -x,  y,  z ) );

	this.vertices.push( new THREE.Vector3(  x,  y, -z ) );
	this.vertices.push( new THREE.Vector3(  x,  y,  z ) );

	this.vertices.push( new THREE.Vector3(  x, -y, -z ) );
	this.vertices.push( new THREE.Vector3(  x, -y,  z ) );

};

CV.BoundingBoxGeometry.prototype = Object.create( THREE.Geometry.prototype );

CV.BoundingBoxGeometry.prototype.constructor = CV.BoundingBoxGeometry;

// EOF