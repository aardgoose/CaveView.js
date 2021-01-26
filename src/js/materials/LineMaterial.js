import {
	ShaderMaterial,
	UniformsLib,
	UniformsUtils,
	Vector2, Vector3
} from '../three';
import { Shaders } from '../shaders/Shaders';

/**
 * parameters = {
 *  color: <hex>,
 *  linewidth: <float>,
 *  dashed: <boolean>,
 *  dashScale: <float>,
 *  dashSize: <float>,
 *  dashOffset: <float>,
 *  gapSize: <float>,
 *  resolution: <Vector2>, // to be set by renderer
 * }
 */

const uniforms = UniformsUtils.merge( [
	UniformsLib.common,
	UniformsLib.fog,
	{
		linewidth: { value: 1 },
		resolution: { value: new Vector2( 1, 1 ) },
		dashScale: { value: 1 },
		dashSize: { value: 1 },
		dashOffset: { value: 0 },
		gapSize: { value: 1 }, // todo FIX - maybe change to totalSize
		opacity: { value: 1 }
	}
] );

var LineMaterial = function ( ctx, mode = 'height' ) {

	const survey = ctx.survey;
	const cfg = ctx.cfg;
	const gradient = cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
	const textureCache = ctx.materials.textureCache;
	const surveyLimits = survey.modelLimits;

	const zMax = surveyLimits.max.z;
	const zMin = surveyLimits.min.z;

	const defines = {};

	let terrain = null;
	let limits = null;
	let range = null;

	if ( survey.terrain ) {

		terrain = survey.terrain;

		if ( terrain.boundingBox ) {

			limits = terrain.boundingBox;
			range = limits.getSize( new Vector3() );

		}

	}

	let customUniforms = {};

	switch ( mode ) {

	case 'height':

		defines.CV_HEIGHT = true;
		customUniforms = {
			minZ:   { value: zMin },
			scaleZ: { value: 1 / ( zMax - zMin ) },
			cmap:   { value: textureCache.getTexture( gradient ) },
		};

		break;

	case 'cursor':

		defines.CV_CURSOR = true;
		customUniforms = {
			cursor:      { value: 0 },
			cursorWidth: { value: 5.0 },
			baseColor:   { value: cfg.themeColor( 'shading.cursorBase' ) },
			cursorColor: { value: cfg.themeColor( 'shading.cursor' ) },
		};
		break;

	case 'depth':

		defines.CV_DEPTH = true;
		customUniforms = Object.assign(
			{
				modelMin:   { value: limits.min },
				scaleX:     { value: 1 / range.x },
				scaleY:     { value: 1 / range.y },
				rangeZ:     { value: range.z },
				depthScale: { value: 1 / ( surveyLimits.max.z - surveyLimits.min.z ) },
				cmap:       { value: textureCache.getTexture( gradient ) },
				depthMap:   { value: terrain.depthTexture },
			},
			ctx.materials.commonDepthUniforms
		);
		break;

	case 'depth-cursor':

		this.max = surveyLimits.max.z - surveyLimits.min.z;

		defines.CV_DEPTH_CURSOR = true;
		customUniforms = Object.assign(
			{
				modelMin:    { value: limits.min },
				scaleX:      { value: 1 / range.x },
				scaleY:      { value: 1 / range.y },
				rangeZ:      { value: range.z },
				depthMap:    { value: terrain.depthTexture },
				cursor:      { value: this.max / 2 },
				cursorWidth: { value: 5.0 },
				baseColor:   { value: cfg.themeColor( 'shading.cursorBase' ) },
				cursorColor: { value: cfg.themeColor( 'shading.cursor' ) },
			},
			ctx.materials.commonDepthUniforms
		);
		break;

	default:
		defines.CV_BASIC = true;

	}

	ShaderMaterial.call( this, {

		type: 'LineMaterial',

		uniforms: Object.assign(
			UniformsUtils.clone( uniforms ),
			customUniforms,
			ctx.materials.commonUniforms
		),

		vertexShader: Shaders.lineVertexShader,
		fragmentShader: Shaders.lineFragmentShader,

		clipping: true, // required for clipping support
		defines: defines
	} );

	this.dashed = false;

	// for cursor material variant
	this.halfRange = ( surveyLimits.max.z - surveyLimits.min.z ) / 2;

	Object.defineProperties( this, {

		color: {

			enumerable: true,

			get: function () {

				return this.uniforms.diffuse.value;

			},

			set: function ( value ) {

				this.uniforms.diffuse.value = value;

			}

		},

		linewidth: {

			enumerable: true,

			get: function () {

				return this.uniforms.linewidth.value;

			},

			set: function ( value ) {

				this.uniforms.linewidth.value = value;

			}

		},

		dashScale: {

			enumerable: true,

			get: function () {

				return this.uniforms.dashScale.value;

			},

			set: function ( value ) {

				this.uniforms.dashScale.value = value;

			}

		},

		dashSize: {

			enumerable: true,

			get: function () {

				return this.uniforms.dashSize.value;

			},

			set: function ( value ) {

				this.uniforms.dashSize.value = value;

			}

		},

		dashOffset: {

			enumerable: true,

			get: function () {

				return this.uniforms.dashOffset.value;

			},

			set: function ( value ) {

				this.uniforms.dashOffset.value = value;

			}

		},

		gapSize: {

			enumerable: true,

			get: function () {

				return this.uniforms.gapSize.value;

			},

			set: function ( value ) {

				this.uniforms.gapSize.value = value;

			}

		},

		opacity: {

			enumerable: true,

			get: function () {

				return this.uniforms.opacity.value;

			},

			set: function ( value ) {

				this.uniforms.opacity.value = value;

			}

		},

		resolution: {

			enumerable: true,

			get: function () {

				return this.uniforms.resolution.value;

			},

			set: function ( value ) {

				this.uniforms.resolution.value.copy( value );

			}

		}

	} );

	this.setValues( {
		color: 0xffffff,
		vertexColors: true,
		linewidth: 1
	} );

	this.resolution = new Vector2( ctx.container.clientWidth, ctx.container.clientHeight );

	ctx.viewer.addEventListener( 'resized', ( e ) => {

		const lineScale = e.lineScale ? e.lineScale : 1;

		this.resolution = new Vector2( e.width, e.height );
		this.linewidth = Math.max( 1, Math.floor( e.width / 1000 ) * lineScale );

	} );

};

LineMaterial.prototype = Object.create( ShaderMaterial.prototype );
LineMaterial.prototype.constructor = LineMaterial;

LineMaterial.prototype.isLineMaterial = true;

LineMaterial.prototype.setCursor = function ( value ) {

	var newValue;

	if ( this.max !== undefined ) {

		newValue = Math.max( Math.min( value, this.max ), 0 ); // depthCursor

	} else {

		newValue = Math.max( Math.min( value, this.halfRange ), -this.halfRange );

	}

	this.uniforms.cursor.value = newValue;

	return newValue; // return value clamped to material range

};

LineMaterial.prototype.getCursor = function () {

	return this.uniforms.cursor.value;

};

export { LineMaterial };
