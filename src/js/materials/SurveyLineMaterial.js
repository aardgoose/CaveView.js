import { Line2NodeMaterial } from '../Nodes.js';

class SurveyLineMaterial extends Line2NodeMaterial {

	constructor ( params = {}, ctx ) {

		super( params );

		this.ctx = ctx;

		Object.defineProperty( this, 'linewidth', {
			get() { return ctx.materials.linewidth; }
		} );

		// this.worldUnits = true;

	}

}

export { SurveyLineMaterial };