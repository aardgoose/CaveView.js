import {
	Points, PointsMaterial, BufferGeometry, Float32BufferAttribute
} from '../../../../three.js/src/Three';

function Point ( material ) {

	var geometry = new BufferGeometry();

	material = material || new PointsMaterial( { color: 0xffffff } );

	geometry.addAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0 ], 3 ) );

	Points.call( this, geometry, material );

	this.type = 'Point';

	return this;

}

Point.prototype = Object.create( Points.prototype );

Point.prototype.constructor = Point;

export { Point };
