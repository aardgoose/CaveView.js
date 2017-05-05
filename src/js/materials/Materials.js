
import { AspectMaterial } from './AspectMaterial';
import { CursorMaterial } from './CursorMaterial';
import { DepthMaterial } from './DepthMaterial';
import { DepthCursorMaterial } from './DepthCursorMaterial';
import { DepthMapMaterial } from './DepthMapMaterial';
import { HeightMaterial } from './HeightMaterial';

import { LineBasicMaterial, VertexColors } from '../../../../three.js/src/Three';

var cache = new Map();
var viewState;

function getHeightMaterial ( type, limits ) {

	var name = 'height' + type;

	if ( cache.has( name ) ) return cache.get( name );

	var material = new HeightMaterial( type, limits );

	cache.set( name, material );

	viewState.addEventListener( 'newCave', _deleteHeightMaterial );

	return material;

	function _deleteHeightMaterial ( /* event */ ) {

		viewState.removeEventListener( 'newCave', _deleteHeightMaterial );

		material.dispose();
		cache.delete( name );

	}

}

function getDepthMapMaterial () {

	return new DepthMapMaterial( viewState.minHeight, viewState.maxHeight );

}

function createDepthMaterial ( type, limits, texture ) {

	var name = 'depth' + type;

	if ( cache.has( name ) ) console.warn( 'createDepthMaterial - already exists' );

	var material = new DepthMaterial( type, limits, texture );

	cache.set( name, material );

	viewState.addEventListener( 'newCave', _deleteDepthMaterial );

	return material;

	function _deleteDepthMaterial ( /* event */ ) {

		viewState.removeEventListener( 'newCave', _deleteDepthMaterial );

		material.dispose();
		cache.delete( name );

	}

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

		return material;

	}

	material = new CursorMaterial( type, limits );

	viewState.initCursorHeight = material.getCursor();

	cache.set( name, material );

	viewState.addEventListener( 'cursorChange', _updateCursorMaterial );
	viewState.addEventListener( 'newCave', _deleteCursorMaterial );

	return material;

	function _deleteCursorMaterial ( /* event */ ) {

		viewState.removeEventListener( 'cursorChange', _updateCursorMaterial );
		viewState.removeEventListener( 'newCave', _deleteCursorhMaterial );

		material.dispose();
		cache.delete( name );

	}

	function _updateCursorMaterial ( /* event */ ) {

		material.setCursor( viewState.cursorHeight );

	}

}

function createDepthCursorMaterial ( type, limits, texture ) {

	var name = 'depthCursor' + type;

	if ( cache.has( name ) ) return cache.get( name );

	var material = new DepthCursorMaterial( type, limits, texture );

	viewState.initCursorHeight = material.getCursor();

	cache.set( name, material );

	viewState.addEventListener( 'cursorChange', _updateDepthCursorMaterial );
	viewState.addEventListener( 'newCave', _deleteDepthCursorMaterial );

	return material;

	function _updateDepthCursorMaterial ( /* event */ ) {

		material.setCursor( viewState.cursorHeight ); // FIXME get value from event

	}

	function _deleteDepthCursorMaterial ( /* event */ ) {

		viewState.removeEventListener( 'cursorChange', _updateDepthCursorMaterial );
		viewState.removeEventListener( 'newCave', _deleteDepthCursorMaterial );

		material.dispose();
		cache.delete( name );

	}

}

function getDepthCursorMaterial( type ) {

	var material = cache.get( 'depthCursor' + type );

	if ( material !== undefined ) {

		// restore current cursor

		viewState.initCursorHeight = material.getCursor();

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
	initCache:              initCache
};

// EOF