import {
	Points, PointsMaterial, BufferGeometry, Float32BufferAttribute
} from '../../../../three.js/src/Three';

function Point ( position ) {

	var geometry = new BufferGeometry();

	geometry.addAttribute( 'position', new Float32BufferAttribute( [ position.x, position.y, position.z ], 3 ) );

	Points.call( this, geometry );

	this.type = 'Point';

	return this;

}

Point.prototype = Object.create( Points.prototype );

Point.prototype.constructor = Point;

export { Point };
