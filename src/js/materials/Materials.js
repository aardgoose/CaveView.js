import { ColourCache } from '../core/ColourCache';
import { SurveyLineMaterial } from './SurveyLineMaterial';
import { TextureCache } from '../core/TextureCache';
import { Line2Material } from './Line2Material';
import { BackSide, FrontSide, IncrementStencilOp, Vector3 } from '../Three';
import { LineBasicNodeMaterial } from '../Nodes';
import { CommonUniforms } from './CommonUniforms';

function Materials ( viewer ) {

	const materialClassCache = new Map();
	const cache = new Map();
	const ctx = viewer.ctx;
	const cfg = ctx.cfg;

	const cursorMaterials = new Set();
	const lineMaterials = new Set();
	const surveyLineMaterials = new Set();
	const wallMaterials = new Set();

	let perSurveyMaterials = {};

	let cursorHeight = 0;
	let linewidth = 1;
	let scaleLinewidth = false;
	let locationMode = false;

	const colourCache = new ColourCache();
	const textureCache = new TextureCache();

	this.colourCache = colourCache;
	this.textureCache = textureCache;

	this.uniforms = {
		common: {
			uLight: { value: new Vector3( -1, -1, 2 ).normalize() },
			distanceFadeMin: { value: 0.0 },
			distanceFadeMax: { value: 0.0 },
			cameraLocation: { value: new Vector3() }
		},

		commonDepth: {
			datumShift: { value: 0.0 }
		}
	};

	this.commonUniforms = new CommonUniforms();
	this.terrainOpacity = 0.5;

	Object.defineProperties( this, {

		'cursorHeight': {
			get() { return cursorHeight; },
			set( newHeight ) {
				cursorMaterials.forEach(
					material => cursorHeight = material.setCursor( newHeight )
				);
			}
		},

		'linewidth': {
			get() { return linewidth; },
			set( width ) {
				lineMaterials.forEach( material => material.linewidth = width );
				linewidth = width;
			}
		},

		'scaleLinewidth': {
			get() { return scaleLinewidth; },
			set( mode ) {
				surveyLineMaterials.forEach( material => material.scaleLinewidth = mode );
				scaleLinewidth = mode;
			}
		}

	} );

	function cacheMaterial ( name, material, stencil ) {

		cache.set( name, material );

		if ( stencil ) {

			material.stencilWrite = true;
			material.stencilZPass = IncrementStencilOp;

		}

		return material;

	}

	function getCacheMaterial ( name, materialFunc, stencil ) {

		let material = cache.get( name );

		if ( material === undefined && materialFunc ) {

			material = cacheMaterial( name, materialFunc(), stencil );
			material.side = viewer.hasModel ? BackSide : FrontSide;

		}

		return material;

	}

	// FIXME add flags for survey specific materials for restting or make materials use object uniforms
	this.getMaterial = function ( materialClass, params = {}, stencil = false ) {

		let materialCache = materialClassCache.get( materialClass );

		if ( ! materialCache ) {

			materialCache = new Map();
			materialClassCache.set( materialClassCache, materialCache );

		}

		const materialCacheKey = JSON.stringify( params );

		let material = materialCache.get( JSON.stringify( materialCacheKey ) );

		if ( ! material ) {

			material = new materialClass( params, ctx );
			materialCache.set( materialCacheKey, material );

		}

		return material;

	}

	function getSurveyCacheMaterial ( name, materialFunc, stencil ) {

		const material = getCacheMaterial( name, materialFunc, stencil );
		perSurveyMaterials[ name ] = material;

		return material;

	}

	this.setLocation = function ( location = null, accuracy = 0, minDistance = 0, maxDistance = 0 ) {

		const updateMaterial = ( material ) => {

			material.defines.CV_LOCATION = locationMode;
			material.transparent = locationMode;
			material.needsUpdate = true;

		};

		const commonUniforms = this.commonUniforms;

		if ( location === null ) {

			if ( locationMode ) {

				console.log( 'disable loc' );
				locationMode = false;

				commonUniforms.accuracy.value = -1.0;

				surveyLineMaterials.forEach( updateMaterial );
				wallMaterials.forEach( updateMaterial );

			}

		} else {

			if ( ! locationMode ) {

				locationMode = true;

				commonUniforms.accuracy.value = accuracy;

				console.log( 'cut', commonUniforms.target.value );
				console.log( 'cua', commonUniforms.accuracy.value );

				surveyLineMaterials.forEach( updateMaterial );
				wallMaterials.forEach( updateMaterial );

			}

			commonUniforms.distanceFadeMin.value = minDistance;
			commonUniforms.distanceFadeMax.value = maxDistance;
			commonUniforms.cameraLocation.value.copy ( location );

			commonUniforms.target.value.set( location.x, location.y );

		}

	};

	this.getSurveyLineMaterial = function ( mode = '', dashed = false ) {

		return this.getMaterial( Line2Material, { color: 'cyan' } );
		const options = { dashed: dashed, location: locationMode };

		const func = () => new SurveyLineMaterial( ctx, mode, options );
		const material = getSurveyCacheMaterial( 'survey-line-' + mode + ( dashed ? '-dashed' : '' ), func, true );

		if ( mode === 'cursor' || mode === 'depth-cursor' ) {

			// set active cursor material for updating
			cursorMaterials.add( material );

		}

		lineMaterials.add( material );
		surveyLineMaterials.add( material );
		material.linewidth = linewidth;

		return material;

	};

	this.getUnselectedMaterial = function () {

		const func = () => new LineBasicNodeMaterial( { color: 0x444444, vertexColors: true } );
		return getCacheMaterial( 'unselected', func );

	};

	this.setTerrain = function ( terrain ) {

		const updateDatumShifts = event => {

			this.commonUniforms.datumShift.value = event.value;

		};

		terrain.addEventListener( 'datumShiftChange', updateDatumShifts );

	};

	this.flushCache = function () {

		cursorMaterials.clear();
		lineMaterials.clear();
		surveyLineMaterials.clear();
		wallMaterials.clear();

		for ( const name in perSurveyMaterials ) {

			const material = perSurveyMaterials[ name ];

			material.dispose();
			cache.delete( name );

		}

		perSurveyMaterials = {};
		ctx.glyphStringCache = new Map();
		cursorHeight = 0;

	};

	this.setFog = function ( enable ) {

		for ( const name in perSurveyMaterials ) {

			const material = perSurveyMaterials[ name ];

			material.fog = enable;
			material.needsUpdate = true;

		}

	};

}

export { Materials };