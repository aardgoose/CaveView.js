import {
	Points, BufferGeometry, Float32BufferAttribute
} from '../Three';

const pointGeometry = new BufferGeometry().addAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0 ], 3 ) );

function Point ( material ) {

	Points.call( this, pointGeometry, material );

	this.type = 'Point';

	return this;

}

Point.prototype = Object.create( Points.prototype );

export { Point };
