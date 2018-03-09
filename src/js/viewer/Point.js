import {
	Points, BufferGeometry, Float32BufferAttribute
} from '../Three';

function Point ( material ) {

	const geometry = new BufferGeometry();

	geometry.addAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0 ], 3 ) );

	Points.call( this, geometry, material );

	this.type = 'Point';

	return this;

}

Point.prototype = Object.create( Points.prototype );

export { Point };
