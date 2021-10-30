import { CursorMaterial } from './CursorMaterial';
import { ClusterMaterial } from './ClusterMaterial';
import { ContourMaterial } from './ContourMaterial';
import { DepthMaterial } from './DepthMaterial';
import { DepthCursorMaterial } from './DepthCursorMaterial';
import { ExtendedPointsMaterial } from './ExtendedPointsMaterial';
import { GlyphMaterial } from './GlyphMaterial';
import { HeightMaterial } from './HeightMaterial';
import { HypsometricMaterial } from './HypsometricMaterial';
import { MissingMaterial } from './MissingMaterial';
import { SurveyLineMaterial } from './SurveyLineMaterial';
import { Line2Material } from './Line2Material';
import { ColourCache } from '../core/ColourCache';
import { TextureCache } from '../core/TextureCache';
import { GlyphAtlasCache } from './GlyphAtlas';
import { EntrancePointMaterial } from './EntrancePointMaterial';

import {
	LineBasicMaterial, MeshLambertMaterial, MeshBasicMaterial, MeshPhongMaterial,
	IncrementStencilOp,
} from '../Three';

function Materials ( viewer ) {

	const cache = new Map();
	const ctx = viewer.ctx;
	const cfg = ctx.cfg;

	const glyphAtlasCache = new GlyphAtlasCache();
	const cursorMaterials = new Set();
	const lineMaterials = new Set();
	const surveyLineMaterials = new Set();

	let perSurveyMaterials = {};

	let cursorHeight = 0;
	let linewidth = 1;
	let scaleLinewidth = false;

	const colourCache = new ColourCache();
	const textureCache = new TextureCache();

	this.colourCache = colourCache;
	this.textureCache = textureCache;

	const gradientType = cfg.value( 'saturatedGradient', false ) || cfg.themeValue( 'saturatedGradient' );
	const gradient = gradientType ? 'gradientHi' : 'gradientLow';
	const surfaceColour = cfg.themeValue( 'shading.single' );

	this.uniforms = {
		common: {
			fogColor: { value: cfg.themeColor( 'background' ) },
			fogDensity: { value: 0.0025 },
			distanceTransparency: { value: 0.0 }
		},

		commonDepth: {
			datumShift: { value: 0.0 }
		},

		cursor: {
			cursor:      { value: 0 },
			cursorWidth: { value: 5.0 },
			baseColor:   { value: cfg.themeColor( 'shading.cursorBase' ) },
			cursorColor: { value: cfg.themeColor( 'shading.cursor' ) },
		}
	};

	this.terrainOpacity = 0.5;

	const distanceTransparency = this.uniforms.common.distanceTransparency;

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
		},

		'distanceTransparency': {
			get() { return distanceTransparency.value; },
			set( x ) { distanceTransparency.value = x; }
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

		if ( material === undefined ) {

			material = cacheMaterial( name, materialFunc(), stencil );

		}

		return material;

	}

	function getSurveyCacheMaterial ( name, materialFunc, stencil ) {

		const material = getCacheMaterial( name, materialFunc, stencil );
		perSurveyMaterials[ name ] = material;

		return material;

	}

	this.getLine2Material = function ( params = { color: 'green' } ) {

		const func = () => new Line2Material( ctx, params );
		const material = getCacheMaterial( 'line2' + JSON.stringify( params ), func, true );

		return material;

	};

	this.getSurveyLineMaterial = function ( mode = '', dashed = false ) {

		const func = () => new SurveyLineMaterial( ctx, mode, dashed );
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

	this.getHeightMaterial = function () {

		const func = () => new HeightMaterial( ctx );
		return getSurveyCacheMaterial( 'height', func, true );

	};

	this.getHypsometricMaterial = function () {

		const func = () => new HypsometricMaterial( ctx );
		return getSurveyCacheMaterial( 'hypsometric', func );

	};

	this.getDepthMaterial = function () {

		const func = () => new DepthMaterial( ctx );
		return getSurveyCacheMaterial( 'depth', func, true );

	};

	this.getCursorMaterial = function () {

		const func = () => new CursorMaterial( ctx );
		const material = getSurveyCacheMaterial( 'cursor', func, true );

		// set active cursor material for updating
		cursorMaterials.add( material );

		return material;

	};

	this.getDepthCursorMaterial = function () {

		const func = () => new DepthCursorMaterial( ctx );
		const material = getSurveyCacheMaterial( 'depthCursor', func, true );

		// set active cursor material for updating
		cursorMaterials.add( material );

		return material;

	};

	this.getBezelMaterial = function  () {

		let func;

		if ( cfg.themeValue( 'hud.bezelType' ) === 'flat' ) {

			func = () => new MeshBasicMaterial( { color: cfg.themeValue( 'hud.bezel' ) } );

		} else {

			func = () => new MeshPhongMaterial( { color: cfg.themeValue( 'hud.bezel' ), specular: 0x888888 } );

		}

		return getCacheMaterial( 'bezel', func, true );

	};

	this.getPlainMaterial = function  () {

		const func = () => new MeshBasicMaterial( { color: 0xffffff, vertexColors: true } );
		return getCacheMaterial( 'plain', func, true );

	};

	this.getSurfaceMaterial = function  () {

		const func = () => new MeshLambertMaterial( { color: surfaceColour, vertexColors: false } );
		return getCacheMaterial( 'surface', func, true );

	};

	this.getEntrancePointMaterial = function  () {

		const func = () => new EntrancePointMaterial( ctx );
		return getCacheMaterial( 'entrance', func, true );

	};

	this.getExtendedPointsMaterial = function () {

		const func = () => new ExtendedPointsMaterial( ctx );
		return getCacheMaterial( 'extendedPoints', func, true );

	};

	this.getMissingMaterial = function () {

		const func = () => new MissingMaterial( ctx );
		return getCacheMaterial( 'missing', func );

	};

	this.getUnselectedMaterial = function () {

		const func = () => new LineBasicMaterial( { color: 0x444444, vertexColors: true } );
		return getCacheMaterial( 'unselected', func );

	};

	this.getUnselectedWallMaterial = function () {

		const func = () => new MeshLambertMaterial( { color: 0x444444, vertexColors: true} );
		return getCacheMaterial( 'unselectedWall', func );

	};

	this.getScaleMaterial = function () {

		const func = () => new MeshBasicMaterial( { color: 0xffffff, map: textureCache.getTexture( gradient ) } );
		return getCacheMaterial( 'scale', func );

	};

	this.getContourMaterial = function () {

		const func = () => new ContourMaterial( ctx );
		return getSurveyCacheMaterial( 'contour', func );

	};

	this.getGlyphMaterial = function ( glyphAtlasSpec, rotation ) {

		const atlas = glyphAtlasCache.getAtlas( glyphAtlasSpec );
		const name = JSON.stringify( glyphAtlasSpec ) + ':' + rotation.toString();

		const func = () => new GlyphMaterial( ctx, atlas, rotation, viewer );

		return getCacheMaterial( name, func );

	};

	this.getClusterMaterial = function ( count ) {

		const func = () => new ClusterMaterial( count );
		return getCacheMaterial( 'cluster' + count, func, true );

	};

	this.setTerrain = function ( terrain ) {

		const updateDatumShifts = event => {

			this.uniforms.commonDepth.datumShift.value = event.value;

		};

		terrain.addEventListener( 'datumShiftChange', updateDatumShifts );

	};

	this.flushCache = function () {

		cursorMaterials.clear();
		lineMaterials.clear();
		surveyLineMaterials.clear();

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