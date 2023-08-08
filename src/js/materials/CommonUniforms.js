import { Vector3 } from '../Three';
import { uniform, vec2, vec3 } from '../Nodes';

class CommonUniforms {

	// shared common uniforms

	constructor ( ctx ) {

		this.ctx = ctx;

		// location ring

		this.accuracy        = uniform( -1.0 );
		this.target          = uniform( vec2( 0, 0 ) );

		// distance fade

		this.distanceFadeMin = uniform( 0.0 );
		this.distanceFadeMax = uniform( 0.0 );
		this.cameraLocation  = uniform( new Vector3(), 'vec3' );

		// terrain adjustment

		this.datumShift = uniform( 0 );
		this.scale      = uniform( vec2( 1, 1 ) );
		this.rangeZ     = uniform( 1 );
		this.zOffset    = uniform( 1 );
		this.hypsometricMinZ = uniform( 1 );
		this.hypsometricScaleZ = uniform( 1 );

		// survey

		this.depthScale = uniform( 1 );
		this.modelMin   = uniform( vec3() );
		this.minZ       = uniform( 1 );
		this.scaleZ     = uniform( 1 );

		// lines
		this.linewidth = uniform( 2 );

	}

	updateLines( linewidth ) {

		this.linewidth.value = linewidth;

	}

	updateSurveyUniforms( survey ) {

		const surveyLimits = survey.modelLimits;

		const zMin = surveyLimits.min.z;
		const zMax = surveyLimits.max.z;

		this.depthScale.value = 1 / ( zMax - zMin );
		this.minZ.value = zMin;
		this.scaleZ.value = 1 / ( zMax - zMin );

	}

	updateTerrainUniforms( terrain ) {

		const limits = terrain.boundingBox;
		const range = limits.getSize( new Vector3() );

		this.modelMin.value = limits.min;

		this.scale.value.x = 1 / range.x;
		this.scale.value.y = 1 / range.y;

		this.rangeZ.value = range.z;
		this.zOffset.value = terrain.offsets.z;

		const cfg = this.ctx.cfg;

		const zMin = cfg.themeValue( 'shading.hypsometric.min', terrain.boundingBox.min.z );
		const zMax = cfg.themeValue( 'shading.hypsometric.max', terrain.boundingBox.max.z );

		this.hypsometricMinZ.value = zMin;
		this.hypsometricScaleZ.value = 1 / ( zMax - zMin );

	}

	terrain() {

		return {
			datumShift: this.datumShift,
			zOffset: this.zOffset,
			hypsometricMinZ: this.hypsometricMinZ,
			hypsometricScaleZ: this.hypsometricScaleZ
		}

	}

	height () {

		return {
			minZ:  this.minZ,
			scaleZ: this.scaleZ
		};

	}

	depth () {  // FIXME - share for line materials when ready

		return {
			modelMin:   this.modelMin,
			scale:      this.scale,
			rangeZ:     this.rangeZ,
			depthScale: this.depthScale,
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

	lines() {

		return {
			linewidth: this.linewidth
		};

	}

}

export { CommonUniforms };