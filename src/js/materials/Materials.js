
import { CursorMaterial } from './CursorMaterial';
import { DepthMaterial } from './DepthMaterial';
import { DepthCursorMaterial } from './DepthCursorMaterial';
import { DepthMapMaterial } from './DepthMapMaterial';
import { HeightMaterial } from './HeightMaterial';
import { GlyphMaterial } from './GlyphMaterial';
import { GlyphString } from '../core/GlyphString';

import { LineBasicMaterial, MeshLambertMaterial, NoColors, VertexColors } from '../Three';

const cache = new Map();

var cursorMaterials = [];
var depthMaterials = [];
var perSurveyMaterials = {};

var viewer;

function updateMaterialCursor ( material ) {

	viewer.initCursorHeight = material.setCursor( viewer.cursorHeight );

}

function updateCursors( /* event */ ) {

	cursorMaterials.forEach( updateMaterialCursor );

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

		material = new HeightMaterial( type, viewer.modelLimits );
		cache.set( name, material );

		perSurveyMaterials[ name ] = material;

	}

	return material;

}

function getDepthMapMaterial ( terrain ) {

	return new DepthMapMaterial( terrain );

}

function getDepthMaterial ( type, terrain ) {

	const name = 'depth' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = new DepthMaterial( type, viewer.modelLimits, terrain );

		cache.set( name, material );

		perSurveyMaterials[ name ] = material;
		depthMaterials.push( material );

	}

	return material;

}

function getCursorMaterial ( type ) {

	const name = 'cursor' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = new CursorMaterial( type, viewer.modelLimits );

		perSurveyMaterials[ name ] = material;

		cache.set( name, material );

	}

	// restore current cursor

	viewer.initCursorHeight = material.getCursor();

	// set active cursor material for updating

	cursorMaterials[ type ] = material;

	return material;

}

function getDepthCursorMaterial( type, terrain ) {

	const name = 'depthCursor' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = new DepthCursorMaterial( type, viewer.modelLimits, terrain );

		perSurveyMaterials[ name ] = material;
		depthMaterials.push( material );

		cache.set( name, material );

	}

	// restore current cursor

	viewer.initCursorHeight = material.getCursor();

	// set active cursor material for updating

	cursorMaterials[ type ] = material;

	return material;

}

function getSurfaceMaterial ( color ) {

	var material = cache.get( 'surface' + color );

	if ( material === undefined ) {

		material = new MeshLambertMaterial( { color: color, vertexColors: NoColors } );
		cache.set( 'surface' + color, material );

	} else {

		material.color.set( color );
		material.needsUpdate = true;

	}

	return material;

}

function getLineMaterial () {

	var material = cache.get( 'line' );

	if ( material === undefined ) {

		material = new LineBasicMaterial( { color: 0xffffff, vertexColors: VertexColors } );
		cache.set( 'line', material );

	}

	return material;

}

function getGlyphMaterial ( glyphAtlasSpec, rotation, colour ) {

	const name = JSON.stringify( glyphAtlasSpec ) + ':' + rotation.toString();

	var material = cache.get( name );

	if ( material === undefined ) {

		material = new GlyphMaterial( glyphAtlasSpec, viewer.container, rotation, colour );
		cache.set( name, material );

	}

	return material;

}

function setTerrain( terrain ) {


	terrain.addEventListener( 'datumShiftChange', updateDatumShifts );

}

function initCache ( Viewer ) {

	cache.clear();

	viewer = Viewer;

	viewer.addEventListener( 'cursorChange', updateCursors );

}

function flushCache() {

	var name;

	for ( name in perSurveyMaterials ) {

		var material = perSurveyMaterials[ name ];

		material.dispose();
		cache.delete( name );

	}

	depthMaterials = [];
	perSurveyMaterials = {};
	GlyphString.cache = new Map();

}

export var Materials = {
	getHeightMaterial:      getHeightMaterial,
	getDepthMapMaterial:    getDepthMapMaterial,
	getDepthMaterial:       getDepthMaterial,
	getDepthCursorMaterial: getDepthCursorMaterial,
	getCursorMaterial:      getCursorMaterial,
	getSurfaceMaterial:     getSurfaceMaterial,
	getLineMaterial:        getLineMaterial,
	getGlyphMaterial:       getGlyphMaterial,
	setTerrain:             setTerrain,
	initCache:              initCache,
	flushCache:             flushCache
};

// EOF