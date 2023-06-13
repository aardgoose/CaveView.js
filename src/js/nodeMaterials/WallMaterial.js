import { SubsurfaceMaterial } from './SubsufaceMaterial';

class WallMaterial extends SubsurfaceMaterial {

	constructor( ctx, options ) {

		super( ctx, { color: ctx.cfg.themeColor( 'shading.single' ) } );

		this.name = 'CV:WallMaterial';

	}

};

export { WallMaterial };