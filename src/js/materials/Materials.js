import { ClusterMaterial } from '../nodeMaterials/ClusterMaterial';
import { ColourCache } from '../core/ColourCache';
import { GlyphMaterial } from '../nodeMaterials/GlyphMaterial';
import { WallMaterial } from '../nodeMaterials/WallMaterial';
import { SurveyLineMaterial } from './SurveyLineMaterial';
import { TextureCache } from '../core/TextureCache';
import { Line2Material } from '../nodeMaterials/Line2Material';

import {
	BackSide,
	Color, FrontSide, IncrementStencilOp,
	Vector2, Vector3
} from '../Three';
import { MeshPhongNodeMaterial, LineBasicNodeMaterial } from '../../../node_modules/three/examples/jsm/nodes/Nodes';
import { CommonUniforms } from '../nodeMaterials/CommonUniforms';

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

	const gradientType = cfg.value( 'saturatedGradient', false ) || cfg.themeValue( 'saturatedGradient' );
	const gradient = gradientType ? 'gradientHi' : 'gradientLow';

	this.uniforms = {
		common: {
			uLight: { value: new Vector3( -1, -1, 2 ).normalize() },
			fogColor: { value: cfg.themeColor( 'background' ) },
			fogDensity: { value: 0.0025 },
			distanceFadeMin: { value: 0.0 },
			distanceFadeMax: { value: 0.0 },
			cameraLocation: { value: new Vector3() }
		},

		commonDepth: {
			datumShift: { value: 0.0 }
		},

		cursor: {
			cursor:      { value: 0 },
			cursorWidth: { value: 5.0 },
			baseColor:   { value: cfg.themeColor( 'shading.cursorBase' ) },
			cursorColor: { value: cfg.themeColor( 'shading.cursor' ) },
		},

		location: {
			accuracy: { value: -1.0 },
			target: { value: new Vector2() },
			ringColor: { value: new Color( 0xff0000 ) },
		}

	};

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

	// FIXME add flags for survey specific materials for restting or make materials use object uniforms
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

	function getWallMaterial ( name, materialClass, stencil ) {

		const material = getSurveyCacheMaterial( name, () => new materialClass( ctx, { location: locationMode } ), stencil );

		wallMaterials.add( material );

		return material;

	}

	this.setLocation = function ( location = null, accuracy = 0, minDistance = 0, maxDistance = 0 ) {

		const updateMaterial = ( material ) => {

			material.defines.CV_LOCATION = locationMode;
			material.transparent = locationMode;
			material.needsUpdate = true;

		};

		const locationUniforms = this.uniforms.location;

		if ( location === null ) {

			if ( locationMode ) {

				console.log( 'disable loc' );
				locationMode = false;

				locationUniforms.accuracy.value = -1.0;
				CommonUniforms.accuracy.value = -1.0;

				surveyLineMaterials.forEach( updateMaterial );
				wallMaterials.forEach( updateMaterial );

			}

		} else {

			if ( ! locationMode ) {

				locationMode = true;

				locationUniforms.accuracy.value = accuracy;
				CommonUniforms.accuracy.value = accuracy;

				console.log( 'cut', CommonUniforms.target.value );
				console.log( 'cua', CommonUniforms.accuracy.value );

				surveyLineMaterials.forEach( updateMaterial );
				wallMaterials.forEach( updateMaterial );

			}

			const commonUniforms = this.uniforms.common;

			commonUniforms.distanceFadeMin.value = minDistance;
			commonUniforms.distanceFadeMax.value = maxDistance;
			commonUniforms.cameraLocation.value.copy( location );

			locationUniforms.target.value.set( location.x, location.y );

			CommonUniforms.distanceFadeMin.value = minDistance;
			CommonUniforms.distanceFadeMax.value = maxDistance;
			CommonUniforms.cameraLocation.value.copy ( location );

			CommonUniforms.target.value.set( location.x, location.y );

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

	this.getSingleWallMaterial = function  () {

		return getWallMaterial( 'single', WallMaterial, true );

	};


	this.getUnselectedWallMaterial = function () {

		const func = () => new MeshPhongNodeMaterial( { color: 0x444444, vertexColors: true } );
		return getCacheMaterial( 'unselectedWall', func );

	};

	this.getSurfaceMaterial = function  () {

		const func = () => new MeshLambertMaterial( { color: cfg.themeValue( 'shading.single' ), vertexColors: false } );
		return getCacheMaterial( 'surface', func, true );

	};

	this.getUnselectedMaterial = function () {

		const func = () => new LineBasicNodeMaterial( { color: 0x444444, vertexColors: true } );
		return getCacheMaterial( 'unselected', func );

	};

	this.getGlyphMaterial = function ( type ) {

		const func = () => new GlyphMaterial( ctx, type, viewer ); // FIXME move rotation into config

		return getCacheMaterial( type, func );

	};

	this.getClusterMaterial = function ( count ) {

		const func = () => new ClusterMaterial( count );
		return getCacheMaterial( 'cluster' + count, func, true );

	};

	this.setTerrain = function ( terrain ) {

		const updateDatumShifts = event => {

			CommonUniforms.datumShift.value = event.value;
			this.uniforms.commonDepth.datumShift.value = event.value;

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