import { Points, BufferGeometry, Float32BufferAttribute } from '../Three';

class Point extends Points {

	constructor ( material, ctx ) {

		const materials = ctx.materials;

		if ( materials.pointGeometry === undefined ) {

			materials.pointGeometry = new BufferGeometry().setAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0 ], 3 ) );

		}

		super( materials.pointGeometry, material );

		this.type = 'Point';

	}

}

export { Point };