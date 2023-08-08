import { SubsurfaceMaterial } from './SubsufaceMaterial';

class WallMaterial extends SubsurfaceMaterial {

	constructor( params, ctx ) {

		super( { color: ctx.cfg.themeColor( 'shading.single' ) }, ctx );

	}

};

export { WallMaterial };