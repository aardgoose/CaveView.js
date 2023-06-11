import { Vector3 } from '../Three';
import { uniform, vec2 } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class CommonUniforms {

    static depth ( ctx ) {

        const survey = ctx.survey;
		const surveyLimits = survey.modelLimits;
		const terrain = survey.terrain;
		const limits = terrain.boundingBox;
		const range = limits.getSize( new Vector3() );

        return {
            modelMin:   uniform( limits.min, 'vec3' ),
            scale:      uniform( vec2( 1 / range.x, 1 / range.y), 'vec2' ),
            rangeZ:     uniform( range.z, 'float' ),
            depthScale: uniform( 1 / ( surveyLimits.max.z - surveyLimits.min.z ), 'float' ),
            datumShift: uniform( 0, 'float' ) // FIXME
        }

    }

    static cursor ( ctx ) {

        const cfg = ctx.cfg;

        return {
            cursor:      uniform( 0, 'float' ),
		    cursorWidth: uniform( 5.0, 'float' ),
		    baseColor:   uniform( cfg.themeColor( 'shading.cursorBase' ) ),
		    cursorColor: uniform( cfg.themeColor( 'shading.cursor' ) ),
        }

    }

}

export { CommonUniforms };