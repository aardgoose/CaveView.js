
CV.BoundingBox = function ( box, colour ) {

	var geometry = new CV.BoundingBoxGeometry( box.size() );
	var material = new THREE.LineBasicMaterial( { color: colour, vertexColors: THREE.NoColors } );

	THREE.LineSegments.call( this, geometry, material );

	this.type = "CV.BoundingBox";

	this.position.copy( box.center() );

	return this;

}

CV.BoundingBox.prototype = Object.create( THREE.LineSegments.prototype );

CV.BoundingBox.prototype.constructor = CV.BoundingBox;


// EOF