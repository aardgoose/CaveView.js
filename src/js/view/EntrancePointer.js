
CV.EntrancePointer = function ( width, height, faceColour1, faceColour2 ) {

	THREE.Geometry.call( this );

	this.type = "CV.Pointer";

	this.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
	this.vertices.push( new THREE.Vector3( -width, 0, height ) );
	this.vertices.push( new THREE.Vector3( width, 0, height ) );
	this.vertices.push( new THREE.Vector3( 0, -width, height ) );
	this.vertices.push( new THREE.Vector3( 0,  width, height ) );

	this.faces.push( new THREE.Face3( 0, 1, 2, new THREE.Vector3( 0, 0, 1 ), faceColour1, 0 ) );
	this.faces.push( new THREE.Face3( 0, 3, 4, new THREE.Vector3( 1, 0, 0 ), faceColour2, 0 ) );

};

CV.EntrancePointer.prototype = Object.create( THREE.Geometry.prototype );

CV.EntrancePointer.prototype.constructor = CV.EntrancePointer;

// EOF