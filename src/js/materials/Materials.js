
import { AspectMaterial } from './AspectMaterial';
import { CursorMaterial } from './CursorMaterial';
import { DepthMaterial } from './DepthMaterial';
import { DepthCursorMaterial } from './DepthCursorMaterial';
import { DepthMapMaterial } from './DepthMapMaterial';
import { HeightMaterial } from './HeightMaterial';

import { LineBasicMaterial, VertexColors } from '../../../../three.js/src/Three';

var cache = new Map();
var viewState;

var cursorMaterials = [];
var perSurveyMaterials = {};

function updateMaterialCursor ( material ) {

	viewState.initCursorHeight = material.setCursor( viewState.cursorHeight );

}

function updateCursors( event ) {

	cursorMaterials.forEach( updateMaterialCursor );

}

function getHeightMaterial ( type, limits ) {

	var name = 'height' + type;

	if ( cache.has( name ) ) return cache.get( name );

	var material = new HeightMaterial( type, limits );

	cache.set( name, material );

	perSurveyMaterials[ name ] = material;

	return material;

}

function getDepthMapMaterial () {

	return new DepthMapMaterial( viewState.minHeight, viewState.maxHeight );

}

function createDepthMaterial ( type, limits, texture ) {

	var name = 'depth' + type;

	if ( cache.has( name ) ) console.warn( 'createDepthMaterial - already exists' );

	var material = new DepthMaterial( type, limits, texture );

	cache.set( name, material );

	perSurveyMaterials[ name ] = material;

	return material;

}

function getDepthMaterial ( type ) {

	return cache.get( 'depth' + type );	

}

function getCursorMaterial ( type, limits ) {

	var name = 'cursor' + type;

	var material = cache.get( name );

	if ( material !== undefined ) {

		// restore current cursor
		viewState.initCursorHeight = material.getCursor();

		// set active cursor material for updating
		cursorMaterials[ type ] = material;

		return material;

	}

	material = new CursorMaterial( type, limits );

	viewState.initCursorHeight = material.getCursor();

	cache.set( name, material );

	perSurveyMaterials[ name ] = material;

	// set active cursor material for updating
	cursorMaterials[ type ] = material;

	return material;

}

function createDepthCursorMaterial ( type, limits, texture ) {

	var name = 'depthCursor' + type;

	if ( cache.has( name ) ) console.warn( 'unexpected material cache entry' );

	var material = new DepthCursorMaterial( type, limits, texture );

	cache.set( name, material );

	perSurveyMaterials[ name ] = material;

	return material;

}

function getDepthCursorMaterial( type ) {

	var material = cache.get( 'depthCursor' + type );

	if ( material !== undefined ) {

		// restore current cursor

		viewState.initCursorHeight = material.getCursor();

		// set active cursor material for updating
		cursorMaterials[ type ] = material;

		return material;

	}

}

function getLineMaterial () {

	if ( cache.has( 'line' ) ) return cache.get( 'line' );

	var material = new LineBasicMaterial( { color: 0xFFFFFF, vertexColors: VertexColors } );

	cache.set( 'line', material );

	return material;

}

function getAspectMaterial () {

	var name = 'aspect';

	if ( cache.has( name ) ) return cache.get(name);

	var material = new AspectMaterial();

	cache.set( name, material );

	return material;

}

function initCache ( viewerViewState ) {

	cache.clear();

	viewState = viewerViewState;

	viewState.addEventListener( 'cursorChange', updateCursors );

}

function flushCache( event ) {

	for ( name in perSurveyMaterials ) {

		var material = perSurveyMaterials[ name ];

		material.dispose();
		cache.delete( name );

	}

	perSurveyMaterials = {};

}

export var Materials = {
	createDepthMaterial:       createDepthMaterial,
	createDepthCursorMaterial: createDepthCursorMaterial,
	getHeightMaterial:      getHeightMaterial,
	getDepthMapMaterial:    getDepthMapMaterial,
	getDepthMaterial:       getDepthMaterial,
	getDepthCursorMaterial: getDepthCursorMaterial,
	getCursorMaterial:      getCursorMaterial,
	getLineMaterial:        getLineMaterial,
	getAspectMaterial:      getAspectMaterial,
	initCache:              initCache,
	flushCache:             flushCache,

};

// EOF