
import { CursorMaterial } from './CursorMaterial';
import { ClusterMaterial } from './ClusterMaterial';
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
var survey;

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

		material = new HeightMaterial( type, survey.modelLimits );
		cache.set( name, material );

		perSurveyMaterials[ name ] = material;

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

		material = new DepthMaterial( type, survey.modelLimits, survey.terrain );

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

		material = new CursorMaterial( type, survey.modelLimits );

		perSurveyMaterials[ name ] = material;

		cache.set( name, material );

	}

	// restore current cursor

	viewer.initCursorHeight = material.getCursor();

	// set active cursor material for updating

	cursorMaterials[ type ] = material;

	return material;

}

function getDepthCursorMaterial( type ) {

	const name = 'depthCursor' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = new DepthCursorMaterial( type, survey.modelLimits, survey.terrain );

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

function getClusterMaterial ( count ) {

	const name = 'cluster' + count;
	var material = cache.get( name );

	if ( material === undefined ) {

		material = new ClusterMaterial( count );
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

function flushCache( surveyIn ) {

	var name;

	for ( name in perSurveyMaterials ) {

		let material = perSurveyMaterials[ name ];

		material.dispose();
		cache.delete( name );

	}

	depthMaterials = [];
	perSurveyMaterials = {};
	GlyphString.cache = new Map();

	survey = surveyIn;

}

export const Materials = {
	getHeightMaterial:      getHeightMaterial,
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
	flushCache:             flushCache
};

// EOF