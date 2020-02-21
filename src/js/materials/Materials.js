import { CursorMaterial } from './CursorMaterial';
import { ClusterMaterial } from './ClusterMaterial';
import { ContourMaterial } from './ContourMaterial';
import { DepthMaterial } from './DepthMaterial';
import { DepthCursorMaterial } from './DepthCursorMaterial';
import { DepthMapMaterial } from './DepthMapMaterial';
import { HeightMaterial } from './HeightMaterial';
import { HypsometricMaterial } from './HypsometricMaterial';
import { GlyphMaterial } from './GlyphMaterial';
import { MissingMaterial } from './MissingMaterial';
import { ColourCache } from '../core/ColourCache';
import { GlyphAtlasCache } from './GlyphAtlas';
import {
	LineBasicMaterial, MeshLambertMaterial, MeshBasicMaterial, MeshPhongMaterial,
	NoColors, VertexColors, IncrementStencilOp, Vector2, Color,
} from '../Three';

function Materials ( viewer ) {

	const cache = new Map();
	const ctx = viewer.ctx;
	const self = this;

	var glyphAtlasCache = new GlyphAtlasCache();
	var cursorMaterials = [];
	var perSurveyMaterials = {};
	var cursorHeight = 0;
	var survey;

	const colourCache = new ColourCache();

	this.colourCache = colourCache;

	const gradientType = ctx.cfg.value( 'saturatedGradient', false ) || ctx.cfg.themeValue( 'saturatedGradient' );
	const gradient = gradientType ? 'gradientHi' : 'gradientLow';
	const surfaceColour = ctx.cfg.themeValue( 'shading.single' );

	this.commonUniforms = {
		fogColor: { value: ctx.cfg.themeColor( 'background' ) },
		fogDensity: { value: 0.0025 },
		fogEnabled: { value: 0 },
		distanceTransparency: { value: 0.0 }
	};

	this.commonDepthUniforms = {
		datumShift: { value: 0.0 }
	};

	this.commonTerrainUniforms = {
		scale: { value: 0.0 },
		accuracy: { value: 0.0 },
		target: { value: new Vector2() },
		ringColor: { value: new Color( 0xff0000 ) }
	};

	this.terrainOpacity = 0.5;

	Object.defineProperty( this, 'cursorHeight', {
		get: function () { return cursorHeight; },
		set: updateCursors
	} );

	const distanceTransparency = this.commonUniforms.distanceTransparency;

	Object.defineProperty( this, 'distanceTransparency', {
		get: function () { return distanceTransparency.value; },
		set: function ( x ) { distanceTransparency.value = x; }
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

		var material = cache.get( 'name' );

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

	function updateCursors( newHeight ) {

		cursorMaterials.forEach( function ( material ) {

			cursorHeight = material.setCursor( newHeight );

		} );

	}

	function updateDatumShifts( event ) {

		self.commonDepthUniforms.datumShift.value = event.value;

	}

	this.getHeightMaterial = function ( type ) {

		const func = function () { return new HeightMaterial( ctx, type, survey ); };
		return getSurveyCacheMaterial( 'height' + type, func, true );

	};

	this.getHypsometricMaterial = function () {

		const func = function () { return new HypsometricMaterial( ctx, survey ); };
		return getSurveyCacheMaterial( 'hypsometric', func );

	};

	this.getDepthMapMaterial = function ( terrain ) {

		return new DepthMapMaterial( terrain );

	};

	this.getDepthMaterial = function ( type ) {

		const func = function () { return new DepthMaterial( ctx, type, survey ); };
		return getSurveyCacheMaterial( 'depth' + type, func, true );

	};

	this.getCursorMaterial = function ( type ) {

		const func = function () { return new CursorMaterial( ctx, type, survey ); };
		const material = getSurveyCacheMaterial( 'cursor' + type, func, true );

		// set active cursor material for updating
		cursorMaterials[ type ] = material;

		return material;

	};

	this.getDepthCursorMaterial = function ( type ) {

		const func = function () { return new DepthCursorMaterial( ctx, type, survey ); };
		const material = getSurveyCacheMaterial( 'depthCursor' + type, func, true );

		// set active cursor material for updating
		cursorMaterials[ type ] = material;

		return material;

	};

	this.getBezelMaterial = function  () {

		var func;

		if ( ctx.cfg.themeValue( 'hud.bezelType' ) === 'flat' ) {

			func = function () { return new MeshBasicMaterial( { color: ctx.cfg.themeValue( 'hud.bezel' ) } ); };

		} else {

			func = function () { return new MeshPhongMaterial( { color: ctx.cfg.themeValue( 'hud.bezel' ), specular: 0x888888 } ); };

		}

		return getCacheMaterial( 'bezel', func, true );

	};

	this.getPlainMaterial = function  () {

		const func = function () { return new MeshBasicMaterial( { color: 0xffffff, vertexColors: VertexColors } ); };
		return getCacheMaterial( 'plain', func, true );

	};

	this.getSurfaceMaterial = function  () {

		const func = function () { return new MeshLambertMaterial( { color: surfaceColour, vertexColors: NoColors } ); };
		return getCacheMaterial( 'surface', func, true );

	};


	this.getLineMaterial = function () {

		const func = function () { return new LineBasicMaterial( { color: 0xffffff, vertexColors: VertexColors } ); };
		return getCacheMaterial( 'line', func, true );

	};

	this.getMissingMaterial = function () {

		const func = function () { return new MissingMaterial( ctx, { transparent: true, opacity: 0.5, color: 0xff8888 } ); };
		return getCacheMaterial( 'missing', func );

	};

	this.getUnselectedMaterial = function () {

		const func = function () { return new LineBasicMaterial( { color: 0x444444, vertexColors: VertexColors } ); };
		return getCacheMaterial( 'unselected', func );

	};

	this.getUnselectedWallMaterial = function () {

		const func = function () { return new MeshLambertMaterial( { color: 0x444444, vertexColors: VertexColors } ); };
		return getCacheMaterial( 'unselectedWall', func );

	};

	this.getScaleMaterial = function () {

		const func = function () { return new MeshBasicMaterial( { color: 0xffffff, map: colourCache.getTexture( gradient ) } ); };
		return getCacheMaterial( 'scale', func );

	};

	this.getContourMaterial = function () {

		const func = function () { return new ContourMaterial( ctx, survey ); };
		return getSurveyCacheMaterial( 'contour', func );

	};

	this.getGlyphMaterial = function ( glyphAtlasSpec, rotation ) {

		const atlas = glyphAtlasCache.getAtlas( glyphAtlasSpec );
		const name = JSON.stringify( glyphAtlasSpec ) + ':' + rotation.toString();

		const func = function () { return new GlyphMaterial( ctx, atlas, rotation, viewer ); };

		return getCacheMaterial( name, func );

	};

	this.getClusterMaterial = function ( count ) {

		const func = function () { return new ClusterMaterial( count ); };
		return getCacheMaterial( 'cluster' + count, func, true );

	};

	this.setTerrain = function ( terrain ) {

		terrain.addEventListener( 'datumShiftChange', updateDatumShifts );

	};

	this.flushCache = function ( surveyIn ) {

		var name;

		for ( name in perSurveyMaterials ) {

			const material = perSurveyMaterials[ name ];

			material.dispose();
			cache.delete( name );

		}

		perSurveyMaterials = {};
		ctx.glyphStringCache = new Map();
		cursorHeight = 0;

		survey = surveyIn;

	};

	this.setFog = function ( enable ) {

		self.commonUniforms.fogEnabled.value = enable ? 1 : 0;

	};

}

export { Materials };