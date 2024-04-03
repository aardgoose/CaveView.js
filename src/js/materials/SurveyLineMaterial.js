import { Line2NodeMaterial } from '../Nodes.js';

class SurveyLineMaterial extends Line2NodeMaterial {

	constructor ( params = {}, ctx ) {

		super( params );

		this.ctx = ctx;

		this.linewidthNode = ctx.materials.commonUniforms.lines().linewidth;

        this.setupShaders();

    }

}

export { SurveyLineMaterial };