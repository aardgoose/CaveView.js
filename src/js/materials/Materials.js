import { ClusterMaterial } from './ClusterMaterial';
import { ColourCache } from '../core/ColourCache';
import { ContourMaterial } from './ContourMaterial';
import { CursorMaterial } from './CursorMaterial';
import { DepthCursorMaterial } from './DepthCursorMaterial';
import { DepthMaterial } from './DepthMaterial';
import { EntrancePointMaterial } from './EntrancePointMaterial';
import { ExtendedPointsMaterial } from './ExtendedPointsMaterial';
import { GlyphAtlasCache } from './GlyphAtlas';
import { GlyphMaterial } from './GlyphMaterial';
import { HeightMaterial } from './HeightMaterial';
import { HypsometricMaterial } from './HypsometricMaterial';
import { Line2Material } from './Line2Material';
import { WallMaterial } from './WallMaterial';
import { MissingMaterial } from './MissingMaterial';
import { SurveyLineMaterial } from './SurveyLineMaterial';
import { TextureCache } from '../core/TextureCache';

import {
	Color, IncrementStencilOp, LineBasicMaterial,
	MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, Vector2, Vector3
} from '../Three';

function Materials ( viewer ) {

	const cache = new Map();
	const ctx = viewer.ctx;
	const cfg = ctx.cfg;

	const glyphAtlasCache = new GlyphAtlasCache();
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
			scale: { value: 0.0 },
			accuracy: { value: 0.0 },
			target: { value: new Vector2() },
			ringColor: { value: new Color( 0xff0000 ) },
		}

	};

	this.terrainOpacity = 0.5;

	const locationUniforms = this.uniforms.location;

	const locationAccuracy = locationUniforms.accuracy;
	const locationScale = locationUniforms.scale;
	const location = locationUniforms.target;

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

		'location': {
			get() { return location.value; },
		},

		'locationAccuracy': {
			get() { return locationAccuracy.value; },
			set( x ) { locationAccuracy.value = x; }
		},

		'locationScale': {
			get() { return locationScale.value; },
			set( x ) { locationScale.value = x; }
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

	this.setLocation = function ( location = null, minDistance = 0, maxDistance = 0 ) {

		const updateMaterial = ( material ) => {

			material.defines.CV_LOCATION = locationMode;
			material.transparent = locationMode;
			material.needsUpdate = true;

		};

		if ( location === null ) {

			if ( locationMode ) {

				console.log( 'disable loc' );
				locationMode = false;

				surveyLineMaterials.forEach( updateMaterial );
				wallMaterials.forEach( updateMaterial );

			}

		} else {

			if ( ! locationMode ) {

				locationMode = true;

				surveyLineMaterials.forEach( updateMaterial );
				wallMaterials.forEach( updateMaterial );

			}

			const commonUniforms = this.uniforms.common;

			commonUniforms.distanceFadeMin.value = minDistance;
			commonUniforms.distanceFadeMax.value = maxDistance;
			commonUniforms.cameraLocation.value.copy( location );

		}

	};

	this.getLine2Material = function ( params = { color: 'green' } ) {

		const func = () => new Line2Material( ctx, params );
		const material = getCacheMaterial( 'line2' + JSON.stringify( params ), func, true );

		return material;

	};

	this.getSurveyLineMaterial = function ( mode = '', dashed = false ) {

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

	this.getHeightMaterial = function () {

		return getWallMaterial( 'height', HeightMaterial, true );

	};

	this.getSingleWallMaterial = function  () {

		return getWallMaterial( 'single', WallMaterial, true );

	};

	this.getDepthMaterial = function () {

		return getWallMaterial( 'depth', DepthMaterial, true );

	};

	this.getCursorMaterial = function () {

		const material = getWallMaterial( 'cursor', CursorMaterial, true );
		cursorMaterials.add( material );

		return material;

	};

	this.getDepthCursorMaterial = function () {

		const material = getWallMaterial( 'depthCursor', DepthCursorMaterial, true );
		cursorMaterials.add( material );

		return material;

	};

	this.getUnselectedWallMaterial = function () {

		const func = () => new MeshLambertMaterial( { color: 0x444444, vertexColors: true } );
		return getCacheMaterial( 'unselectedWall', func );

	};

	this.getHypsometricMaterial = function () {

		const func = () => new HypsometricMaterial( ctx );
		return getSurveyCacheMaterial( 'hypsometric', func );

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

		const func = () => new MeshLambertMaterial( { color: cfg.themeValue( 'shading.single' ), vertexColors: false } );
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

	this.getLabelMaterial = function ( type ) {

		let material = getCacheMaterial( `label-${type}` );

		if ( material === undefined ) {

			const atlasSpec = {
				color: cfg.themeColorCSS( `${type}.text` ),
				background: cfg.themeValue( `${type}.background` ),
				font: cfg.themeValue( `${type}.font` )
			};

			material = this.getGlyphMaterial( atlasSpec, 0 );

		}

		return material;

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