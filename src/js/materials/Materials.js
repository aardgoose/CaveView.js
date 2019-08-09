
import { CursorMaterial } from './CursorMaterial';
import { ClusterMaterial } from './ClusterMaterial';
import { ContourMaterial } from './ContourMaterial';
import { DepthMaterial } from './DepthMaterial';
import { DepthCursorMaterial } from './DepthCursorMaterial';
import { DepthMapMaterial } from './DepthMapMaterial';
import { HeightMaterial } from './HeightMaterial';
import { HypsometricMaterial } from './HypsometricMaterial';
import { GlyphMaterial } from './GlyphMaterial';
import { GlyphString } from '../core/GlyphString';
import { MaterialFog } from './MaterialFog';

import {
	LineBasicMaterial, MeshLambertMaterial,
	NoColors, VertexColors, IncrementStencilOp, EqualStencilFunc
} from '../Three';

const cache = new Map();

var cursorMaterials = [];

var depthMaterials = [];
var perSurveyMaterials = {};
var cursorHeight = 0;

var viewer;
var survey;

function setStencil( material ) {

	material.stencilWrite = true;
	material.stencilZPass = IncrementStencilOp;

}

function testStencil( material ) {

	material.stencilWrite = true;
	material.stencilFunc = EqualStencilFunc;


}

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

	const datumShift = event.value;

	depthMaterials.forEach( _updateMaterialDepth );

	function _updateMaterialDepth ( material ) {

		material.setDatumShift( datumShift );

	}

}


function getHeightMaterial ( type ) {

	const name = 'height' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheSurveyMaterial( name, new HeightMaterial( type, survey ) );
		setStencil( material );

	}

	return material;

}

function getHypsometricMaterial () {

	const name = 'hypsometric';

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheSurveyMaterial( name, new HypsometricMaterial( survey ) );
		testStencil( material );

	}

	return material;

}

function getDepthMapMaterial ( terrain ) {

	return new DepthMapMaterial( terrain );

}

function getDepthMaterial ( type ) {

	const name = 'depth' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheSurveyMaterial( name, new DepthMaterial( type, survey ) );
		setStencil( material );

		depthMaterials.push( material );

	}

	return material;

}

function getCursorMaterial ( type ) {

	const name = 'cursor' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheSurveyMaterial( name, new CursorMaterial( type, survey ) );
		setStencil( material );

	}

	// set active cursor material for updating

	cursorMaterials[ type ] = material;

	return material;

}

function getDepthCursorMaterial( type ) {

	const name = 'depthCursor' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheSurveyMaterial( name, new DepthCursorMaterial( type, survey ) );
		setStencil( material );

		depthMaterials.push( material );

	}

	// set active cursor material for updating

	cursorMaterials[ type ] = material;

	return material;

}

function getSurfaceMaterial ( color ) {

	const name = 'surface' + color;
	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheMaterial( name, new MeshLambertMaterial( { color: color, vertexColors: NoColors } ) );

	}

	return material;

}

function getLineMaterial () {

	var material = cache.get( 'line' );

	if ( material === undefined ) {

		material = cacheMaterial( 'line', new LineBasicMaterial( { color: 0xffffff, vertexColors: VertexColors } ) );
		setStencil( material );

	}

	return material;

}

function getContourMaterial () {

	var material = cache.get( 'contour' );

	if ( material === undefined ) {

		material = cacheSurveyMaterial( 'contour', new ContourMaterial( survey ) );

		depthMaterials.push( material );

	}

	return material;

}

function getGlyphMaterial ( glyphAtlasSpec, rotation ) {

	const name = JSON.stringify( glyphAtlasSpec ) + ':' + rotation.toString();

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheMaterial( name, new GlyphMaterial( glyphAtlasSpec, rotation, viewer ) );

	}

	return material;

}

function getClusterMaterial ( count ) {

	const name = 'cluster' + count;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheMaterial( name, new ClusterMaterial( count ) );
		setStencil( material );

	}

	return material;

}

function setTerrain( terrain ) {

	terrain.addEventListener( 'datumShiftChange', updateDatumShifts );

}

function initCache ( Viewer ) {

	cache.clear();

	viewer = Viewer;


}

function flushCache( surveyIn ) {

	var name;

	for ( name in perSurveyMaterials ) {

		const material = perSurveyMaterials[ name ];

		material.dispose( viewer );
		cache.delete( name );

	}

	depthMaterials = [];
	perSurveyMaterials = {};
	GlyphString.cache = new Map();
	cursorHeight = 0;

	survey = surveyIn;

}

function setFog( enable ) {

	MaterialFog.uniforms.fogEnabled.value = enable ? 1 : 0;

	return;

}

const Materials = {
	getContourMaterial:     getContourMaterial,
	getHeightMaterial:      getHeightMaterial,
	getHypsometricMaterial: getHypsometricMaterial,
	getDepthMapMaterial:    getDepthMapMaterial,
	getDepthMaterial:       getDepthMaterial,
	getDepthCursorMaterial: getDepthCursorMaterial,
	getClusterMaterial:     getClusterMaterial,
	getCursorMaterial:      getCursorMaterial,
	getSurfaceMaterial:     getSurfaceMaterial,
	getLineMaterial:        getLineMaterial,
	getGlyphMaterial:       getGlyphMaterial,
	setTerrain:             setTerrain,
	initCache:              initCache,
	flushCache:             flushCache,
	setFog:                 setFog
};

Object.defineProperty( Materials, 'cursorHeight', {
	writeable: true,
	get: function () { return cursorHeight; },
	set: updateCursors
} );


export { Materials };
// EOF