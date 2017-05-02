
import { AspectMaterial } from './AspectMaterial';
import { CursorMaterial } from './CursorMaterial';
import { DepthMaterial } from './DepthMaterial';
import { DepthCursorMaterial } from './DepthCursorMaterial';
import { DepthMapMaterial } from './DepthMapMaterial';
import { HeightMaterial } from './HeightMaterial';

import { LineBasicMaterial, VertexColors } from '../../../../three.js/src/Three';

var cache = new Map();
var viewState;

function getHeightMaterial ( type ) {

	var name = 'height' + type;

	if ( cache.has( name ) ) return cache.get( name );

	var material = new HeightMaterial( type, viewState.minHeight, viewState.maxHeight );

	cache.set( name, material );

	viewState.addEventListener( 'newCave', _updateHeightMaterial );

	return material;

	function _updateHeightMaterial ( /* event */ ) {

		var minHeight = viewState.minHeight;
		var maxHeight = viewState.maxHeight;

		material.uniforms.minZ.value = minHeight;
		material.uniforms.scaleZ.value =  1 / ( maxHeight - minHeight );

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

	viewState.addEventListener( 'newCave', _updateDepthMaterial );

	return material;

	function _updateDepthMaterial ( /* event */ ) {

		viewState.removeEventListener( 'newCave', _updateDepthMaterial );

		material.dispose();
		cache.delete( name );

	}

}

function getDepthMaterial ( type ) {

	return cache.get( 'depth' + type );	

}

function getCursorMaterial ( type ) {

	var name = 'cursor' + type;

	if ( cache.has( name ) ) return cache.get( name );

	var initialHeight = Math.max( Math.min( viewState.cursorHeight, viewState.maxHeight ), viewState.minHeight );

	var material = new CursorMaterial( type, initialHeight );

	cache.set( name, material );

	viewState.addEventListener( 'cursorChange', _updateCursorMaterial );

	return material;

	function _updateCursorMaterial ( /* event */ ) {

		var cursorHeight = Math.max( Math.min( viewState.cursorHeight, viewState.maxHeight ), viewState.minHeight );

		material.uniforms.cursor.value = cursorHeight;

	}

}

function createDepthCursorMaterial ( limits, texture, initialDepth ) {

	var name = 'depthCursor';

	if ( cache.has( name ) ) return cache.get( name );

//	var initialDepth = Math.max( Math.min( viewState.cursorHeight, viewState.maxHeight ), 0 );

	viewState.cursorHeight = 20;

	var material = new DepthCursorMaterial( limits, texture, 20 );

	cache.set( name, material );

	viewState.addEventListener( 'cursorChange', _updateDepthCursorMaterial );
	viewState.addEventListener( 'newCave', _deleteDepthCursorMaterial );

	return material;

	function _updateDepthCursorMaterial ( /* event */ ) {

		var cursorHeight = Math.max( Math.min( viewState.cursorHeight, viewState.maxHeight - viewState.minHeight ), 0 );

		material.uniforms.cursor.value = cursorHeight;

	}

	function _deleteDepthCursorMaterial ( /* event */ ) {

		viewState.removeEventListener( 'newCave', _deleteDepthCursorMaterial );
		viewState.removeEventListener( 'cursorChange', _updateDepthCursorMaterial );

		material.dispose();
		cache.delete( name );

	}

}

function getDepthCursorMaterial () {

	return cache.get( 'depthCursor' );

}

function getLineMaterial () {

	var name = 'line';

	if ( cache.has( name ) ) return cache.get(name);

	var material = new LineBasicMaterial( { color: 0xFFFFFF, vertexColors: VertexColors } );

	cache.set( name, material );

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