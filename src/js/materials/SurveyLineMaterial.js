import { Vector3, cloneUniforms } from '../Three';
import { Line2Material } from './Line2Material';

// subclass Line2Material to provide custom defines and uniforms

class SurveyLineMaterial extends Line2Material {

	constructor ( ctx, mode = 'height', dashed ) {

		const survey = ctx.survey;
		const cfg = ctx.cfg;
		const gradient = cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const textureCache = ctx.materials.textureCache;
		const surveyLimits = survey.modelLimits;
		const uniforms = ctx.materials.uniforms;

		const zMax = surveyLimits.max.z;
		const zMin = surveyLimits.min.z;

		const defines = {};

		let terrain = null;
		let limits = null;
		let range = null;
		let max = null;

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
			customUniforms = cloneUniforms( uniforms.cursor );
			customUniforms.cursor.value = max;
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
				uniforms.commonDepth
			);
			break;

		case 'depth-cursor':

			max = surveyLimits.max.z - surveyLimits.min.z;

			defines.CV_DEPTH_CURSOR = true;
			customUniforms = Object.assign(
				{
					modelMin:    { value: limits.min },
					scaleX:      { value: 1 / range.x },
					scaleY:      { value: 1 / range.y },
					rangeZ:      { value: range.z },
					depthMap:    { value: terrain.depthTexture }
				},
				cloneUniforms( uniforms.cursor ),
				uniforms.commonDepth
			);
			customUniforms.cursor.value = max / 2;
			break;

		case 'z':

			defines.CV_Z = true;
			break;

		default:

			defines.CV_BASIC = true;

		}

		if ( dashed ) defines.USE_DASH = true;

		const params = {
			color: 0xffffff,
			vertexColors: true,
			dashSize: 2,
			gapSize: 2
		};

		super( ctx, params, defines, customUniforms );

		// for cursor material variant
		this.halfRange = ( surveyLimits.max.z - surveyLimits.min.z ) / 2;
		this.max = max;

	}

	setCursor ( value ) {

		let newValue;

		if ( this.max !== null ) {

			newValue = Math.max( Math.min( value, this.max ), 0 ); // depthCursor

		} else {

			newValue = Math.max( Math.min( value, this.halfRange ), -this.halfRange );

		}

		this.uniforms.cursor.value = newValue;

		return newValue; // return value clamped to material range

	}

	getCursor () {

		return this.uniforms.cursor.value;

	}

}

export { SurveyLineMaterial };