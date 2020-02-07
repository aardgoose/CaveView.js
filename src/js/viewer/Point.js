import {
	Points, BufferGeometry, Float32BufferAttribute
} from '../Three';

function Point ( material, ctx ) {

	const materials = ctx.materials;

	if ( materials.pointGeometry === undefined ) {

		materials.pointGeometry = new BufferGeometry().setAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0 ], 3 ) );

	}

	Points.call( this, materials.pointGeometry, material );

	this.type = 'Point';

	return this;

}

Point.prototype = Object.create( Points.prototype );

export { Point };
