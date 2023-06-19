import { SubsurfaceMaterial } from './SubsufaceMaterial';

class WallMaterial extends SubsurfaceMaterial {

	constructor( options, ctx ) {

		super( ctx, { color: ctx.cfg.themeColor( 'shading.single' ) } );

		this.name = 'CV:WallMaterial';

	}

};

export { WallMaterial };