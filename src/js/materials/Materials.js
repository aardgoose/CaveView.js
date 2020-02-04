
import { CursorMaterial } from './CursorMaterial';
import { ClusterMaterial } from './ClusterMaterial';
import { ContourMaterial } from './ContourMaterial';
import { DepthMaterial } from './DepthMaterial';
import { DepthCursorMaterial } from './DepthCursorMaterial';
import { DepthMapMaterial } from './DepthMapMaterial';
import { HeightMaterial } from './HeightMaterial';
import { HypsometricMaterial } from './HypsometricMaterial';
import { GlyphMaterial } from './GlyphMaterial';
import { ColourCache } from '../core/ColourCache';

import {
	LineBasicMaterial, MeshLambertMaterial, MeshBasicMaterial,
	NoColors, VertexColors, IncrementStencilOp
} from '../Three';


function setStencil ( material ) {

	material.stencilWrite = true;
	material.stencilZPass = IncrementStencilOp;

}

function Materials ( viewer ) {

	const cache = new Map();
	const ctx = viewer.ctx;

	var cursorMaterials = [];
	var perSurveyMaterials = {};
	var cursorHeight = 0;
	var survey;

	this.commonUniforms = {
		fogColor: { value: ctx.cfg.themeColor( 'background' ) },
		fogDensity: { value: 0.0025 },
		fogEnabled: { value: 0 },
		distanceTransparency: { value: 0.0 }
	};

	this.commonDepthUniforms = {
		datumShift: { value: 0.0 }
	};

	Object.defineProperty( this, 'cursorHeight', {
		writeable: true,
		get: function () { return cursorHeight; },
		set: updateCursors
	} );

	function cacheMaterial ( name, material ) {

		cache.set( name, material );

		return material;

	}

	function cacheSurveyMaterial ( name, material ) {

		cache.set( name, material );
		perSurveyMaterials[ name ] = material;

		return material;

	}


	function updateCursors( newHeight ) {

		cursorMaterials.forEach( function ( material ) {

			cursorHeight = material.setCursor( newHeight );

		} );

	}

	function updateDatumShifts( event ) {

		ctx.materials.commonDepthUniforms.datumShift.value = event.value;

	}

	this.getHeightMaterial = function ( type ) {

		const name = 'height' + type;

		var material = cache.get( name );

		if ( material === undefined ) {

			material = cacheSurveyMaterial( name, new HeightMaterial( ctx, type, survey ) );
			setStencil( material );

		}

		return material;

	};

	this.getHypsometricMaterial = function () {

		const name = 'hypsometric';

		var material = cache.get( name );

		if ( material === undefined ) {

			material = cacheSurveyMaterial( name, new HypsometricMaterial( ctx, survey ) );

		}

		return material;

	};

	this.getDepthMapMaterial = function ( terrain ) {

		return new DepthMapMaterial( terrain );

	};

	this.getDepthMaterial = function ( type ) {

		const name = 'depth' + type;

		var material = cache.get( name );

		if ( material === undefined ) {

			material = cacheSurveyMaterial( name, new DepthMaterial( ctx, type, survey ) );
			setStencil( material );

		}

		return material;

	};

	this.getCursorMaterial = function ( type ) {

		const name = 'cursor' + type;

		var material = cache.get( name );

		if ( material === undefined ) {

			material = cacheSurveyMaterial( name, new CursorMaterial( ctx, type, survey ) );
			setStencil( material );

		}

		// set active cursor material for updating

		cursorMaterials[ type ] = material;

		return material;

	};

	this.getDepthCursorMaterial = function ( type ) {

		const name = 'depthCursor' + type;

		var material = cache.get( name );

		if ( material === undefined ) {

			material = cacheSurveyMaterial( name, new DepthCursorMaterial( ctx, type, survey ) );
			setStencil( material );

		}

		// set active cursor material for updating

		cursorMaterials[ type ] = material;

		return material;

	};

	this.getSurfaceMaterial = function ( color ) {

		const name = 'surface' + color;
		var material = cache.get( name );

		if ( material === undefined ) {

			material = cacheMaterial( name, new MeshLambertMaterial( { color: color, vertexColors: NoColors } ) );
			setStencil( material );

		}

		return material;

	};

	this.getLineMaterial = function () {

		var material = cache.get( 'line' );

		if ( material === undefined ) {

			material = cacheMaterial( 'line', new LineBasicMaterial( { color: 0xffffff, vertexColors: VertexColors } ) );
			setStencil( material );

		}

		return material;

	};

	this.getScaleMaterial = function () {

		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';

		var material = cache.get( 'scale' );

		if ( material === undefined ) {

			material = cacheMaterial( 'scale', new MeshBasicMaterial(
				{
					color: 0xffffff,
					map: ColourCache.getTexture( gradient )
				} ) );

		}

		return material;

	};

	this.getContourMaterial = function () {

		var material = cache.get( 'contour' );

		if ( material === undefined ) {

			material = cacheSurveyMaterial( 'contour', new ContourMaterial( ctx, survey ) );

		}

		return material;

	};

	this.getGlyphMaterial = function ( glyphAtlasSpec, rotation ) {

		const name = JSON.stringify( glyphAtlasSpec ) + ':' + rotation.toString();

		var material = cache.get( name );

		if ( material === undefined ) {

			material = cacheMaterial( name, new GlyphMaterial( ctx, glyphAtlasSpec, rotation, viewer ) );

		}

		return material;

	};

	this.getClusterMaterial = function ( count ) {

		const name = 'cluster' + count;

		var material = cache.get( name );

		if ( material === undefined ) {

			material = cacheMaterial( name, new ClusterMaterial( count ) );
			setStencil( material );

		}

		return material;

	};

	this.setTerrain = function ( terrain ) {

		terrain.addEventListener( 'datumShiftChange', updateDatumShifts );

	};

	this.flushCache = function ( surveyIn ) {

		var name;

		for ( name in perSurveyMaterials ) {

			const material = perSurveyMaterials[ name ];

			material.dispose( viewer );
			cache.delete( name );

		}

		perSurveyMaterials = {};
		ctx.lyphStringCache = new Map();
		cursorHeight = 0;

		survey = surveyIn;

	};

	this.setFog = function ( enable ) {

		ctx.materials.commonUniforms.fogEnabled.value = enable ? 1 : 0;

	};

	this.setDistanceTransparency = function ( distance ) {

		ctx.materials.commonUniforms.distanceTransparency.value = distance;

	};

}

export { Materials };

// EOF