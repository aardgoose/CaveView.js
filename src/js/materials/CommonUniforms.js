import { Vector3 } from '../Three';
import { uniform, vec2 } from '../Nodes';

class CommonUniforms {

	// shared common uniforms

	constructor () {

		// terrain adjustment
		this.datumShift      = uniform( 0, 'float' );

		// location ring
		this.accuracy        = uniform( -1.0, 'float' );
		this.target          = uniform( vec2( 0, 0 ), 'vec2' );

		// distance fade
		this.distanceFadeMin = uniform( 0.0, 'float' );
		this.distanceFadeMax = uniform( 0.0, 'float' );
		this.cameraLocation  = uniform( new Vector3(), 'vec3' );

	}


	depth ( ctx ) {  // FIXME - share for line materials when ready

		const survey = ctx.survey;
		const surveyLimits = survey.modelLimits;
		const terrain = survey.terrain;
		const limits = terrain.boundingBox;
		const range = limits.getSize( new Vector3() );

		return {
			modelMin:   uniform( limits.min ),
			scale:      uniform( vec2( 1 / range.x, 1 / range.y ) ),
			rangeZ:     uniform( range.z ),
			depthScale: uniform( 1 / ( surveyLimits.max.z - surveyLimits.min.z ) ),
			datumShift: this.datumShift
		}

	}

	cursor ( ctx ) { // FIXME - share for line materials when ready

		const cfg = ctx.cfg;

		return {
			cursor:      uniform( 0 ),
			cursorWidth: uniform( 5.0 ),
			baseColor:   uniform( cfg.themeColor( 'shading.cursorBase' ) ),
			cursorColor: uniform( cfg.themeColor( 'shading.cursor' ) ),
		};

	}

	location ( ctx ) {

		return {
			accuracy:  this.accuracy,
			target:    this.target,
			ringColor: uniform( ctx.cfg.themeColor( 'shading.ringColor' ), 'vec3' )
		};

	}

	distanceFade( ) {

		return {
			distanceFadeMin: this.distanceFadeMin,
			distanceFadeMax: this.distanceFadeMax,
			cameraLocation:  this.cameraLocation
		};

	}

}

export { CommonUniforms };