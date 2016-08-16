
function EntranceFarPointer () {

	var geometry  = new THREE.Geometry();
	var loader  = new THREE.TextureLoader();

	var texture  = loader.load( getEnvironmentValue( "cvDirectory", "" ) + "CaveView/images/marker-yellow.png" );

	var material = new THREE.PointsMaterial( { size: 10, map: texture, transparent : true, sizeAttenuation: false } );

	geometry.vertices.push( new THREE.Vector3( 0, 0, 10 ) );
	geometry.colors.push( new THREE.Color( 0xff00ff ) );

	this.type = "CV.EntranceFarPointer";

	var point = THREE.Points.call( this, geometry, material );

}

EntranceFarPointer.prototype = Object.create( THREE.Points.prototype );

EntranceFarPointer.prototype.constructor = CV.EntranceFarPointer;

export { EntranceFarPointer };

// EOF