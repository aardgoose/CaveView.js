
import { CursorMaterial } from './CursorMaterial';
import { DepthMaterial } from './DepthMaterial';
import { DepthCursorMaterial } from './DepthCursorMaterial';
import { DepthMapMaterial } from './DepthMapMaterial';
import { HeightMaterial } from './HeightMaterial';
import { GlyphMaterial } from './GlyphMaterial';

import { LineBasicMaterial, MeshLambertMaterial, NoColors, VertexColors } from '../../../../three.js/src/Three';

var cache = new Map();
var viewer;

var cursorMaterials = [];
var depthMaterials = [];
var perSurveyMaterials = {};
var depthTexture = null;

function updateMaterialCursor ( material ) {

	viewer.initCursorHeight = material.setCursor( viewer.cursorHeight );

}

function updateCursors( /* event */ ) {

	cursorMaterials.forEach( updateMaterialCursor );

}

function updateDatumShifts( event ) {

	var datumShift = event.value;

	depthMaterials.forEach( _updateMaterialDepth );

	function _updateMaterialDepth ( material ) {

		material.setDatumShift( datumShift );

	}

}


function getHeightMaterial ( type, limits ) {

	var name = 'height' + type;

	if ( cache.has( name ) ) return cache.get( name );

	var material = new HeightMaterial( type, limits );

	cache.set( name, material );

	perSurveyMaterials[ name ] = material;

	return material;

}

function getDepthMapMaterial ( survey ) {

	return new DepthMapMaterial( survey );

}

function getDepthMaterial ( type, limits ) {

	var name = 'depth' + type;
	var material = cache.get( name );

	if ( material === undefined ) {

		material = new DepthMaterial( type, limits, depthTexture );

		cache.set( name, material );

		perSurveyMaterials[ name ] = material;
		depthMaterials.push( material );

	}

	return material;

}

function getCursorMaterial ( type, limits ) {

	var name = 'cursor' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = new CursorMaterial( type, limits );

		perSurveyMaterials[ name ] = material;

		cache.set( name, material );

	}

	// restore current cursor

	viewer.initCursorHeight = material.getCursor();

	// set active cursor material for updating

	cursorMaterials[ type ] = material;

	return material;

}

function getDepthCursorMaterial( type, limits ) {

	var name = 'depthCursor' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = new DepthCursorMaterial( type, limits, depthTexture );

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

function getSurfaceMaterial () {

	if ( cache.has( 'surface' ) ) return cache.get( 'surface' );

	var material = new MeshLambertMaterial( { color: 0xFFFFFF, vertexColors: NoColors } );

	cache.set( 'surface', material );

	return material;

}

function getLineMaterial () {

	if ( cache.has( 'line' ) ) return cache.get( 'line' );

	var material = new LineBasicMaterial( { color: 0xFFFFFF, vertexColors: VertexColors } );

	cache.set( 'line', material );

	return material;

}

function getGlyphMaterial ( glyphAtlasSpec, rotation, colour ) {

	var name = glyphAtlasSpec + ':' + rotation.toString() + ':' + ( colour ? colour.toString() : 'default' );

	if ( cache.has( name ) ) return cache.get( name );

	var material = new GlyphMaterial( glyphAtlasSpec, viewer.container, rotation, colour );

	cache.set( name, material );

	return material;

}

function setDepthTexture( texture, terrain ) {

	depthTexture = texture;
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

	if ( depthTexture !== null ) {

		depthTexture.dispose();
		depthTexture = null;
		depthMaterials = [];

	}

	perSurveyMaterials = {};

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
	setDepthTexture:        setDepthTexture,
	initCache:              initCache,
	flushCache:             flushCache
};

// EOF