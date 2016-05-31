"use strict";

var CV = CV || {};

CV.Materials = ( function () {

var cache = new Map();
var viewState;

function getHeightMaterial ( type ) {

	var name = "height" + type;

	if ( cache.has( name ) ) return cache.get( name );

	var material = new CV.HeightMaterial( type, viewState.minHeight, viewState.maxHeight );

	cache.set(name, material);

	viewState.addEventListener( "newCave",  _updateHeightMaterial );

	return material;

	function _updateHeightMaterial ( event ) {

		var minHeight = viewState.minHeight;
		var maxHeight = viewState.maxHeight;

		material.uniforms.minZ.value = minHeight;
		material.uniforms.scaleZ.value =  1 / ( maxHeight - minHeight );

	}

}

function getDepthMapMaterial () {

	return new CV.DepthMapMaterial( viewState.minHeight, viewState.maxHeight );

}

function getDepthMaterial ( type, limits, texture ) {

	var name = "depth" + type;

	if ( cache.has( name ) ) return cache.get( name );
	
	var material = new CV.DepthMaterial( type, limits, texture );

	cache.set(name, material);

	viewState.addEventListener( "newCave",  _updateDepthMaterial );

	return material;

	function _updateDepthMaterial ( event ) {

		cache.delete( name );

	}

}

function getCursorMaterial ( type, halfWidth ) {

	var name = "cursor" + type;

	if ( cache.has(name) ) return cache.get( name );

	var initialHeight = Math.max( Math.min( viewState.cursorHeight, viewState.maxHeight ), viewState.minHeight );

	var material = new CV.CursorMaterial( type, initialHeight );

	cache.set( name, material );

	viewState.addEventListener( "cursorChange",  _updateCursorMaterial );

	return material;

	function _updateCursorMaterial ( event ) {

		var cursorHeight = Math.max( Math.min( viewState.cursorHeight, viewState.maxHeight ), viewState.minHeight );

		material.uniforms.cursor.value = cursorHeight;

	}

}

function getLineMaterial () {

	var name = "line";

	if ( cache.has( name ) ) {
		
		return cache.get(name);

	}

	var material = new THREE.LineBasicMaterial( { color: 0xFFFFFF, vertexColors: THREE.VertexColors } );   

	cache.set( name, material );

	return material;

}

function initCache ( viewerViewState ) {

	cache.clear();

	viewState = viewerViewState;

}

return {

	getHeightMaterial:   getHeightMaterial,
	getDepthMapMaterial: getDepthMapMaterial,
	getDepthMaterial:    getDepthMaterial,
	getCursorMaterial:   getCursorMaterial,
	getLineMaterial:     getLineMaterial,
	initCache:           initCache

};


} () );

// EOF