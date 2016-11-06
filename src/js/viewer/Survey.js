
import {
	NORMAL, SPLAY, SURFACE,
	FACE_SCRAPS, FACE_WALLS,
	FEATURE_ENTRANCES, FEATURE_SELECTED_BOX, FEATURE_BOX,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE,
	MATERIAL_LINE, MATERIAL_SURFACE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_OVERLAY, SHADING_SURVEY, SHADING_SINGLE, SHADING_SHADED,
	upAxis
} from '../core/constants.js';

import { getEnvironmentValue } from '../core/constants.js';
import { ColourCache } from '../core/ColourCache.js';
import { Tree } from '../core/Tree.js';
import { Materials } from '../materials/Materials.js';
import { Marker } from './Marker.js';
import { Terrain } from '../terrain/Terrain.js';
import { CaveLoader } from '../loaders/CaveLoader.js';
import { WorkerPool } from '../workers/WorkerPool.js';

import {
	Vector3, Face3, Color, Box3,
	Geometry, PlaneGeometry,
	MeshLambertMaterial, MeshBasicMaterial, MultiMaterial, LineBasicMaterial,
	FaceColors, NoColors, FrontSide, VertexColors,
	Object3D, Mesh, Group, LineSegments,
	BoxHelper
} from '../../../../three.js/src/Three.js';

function Survey ( cave ) {

	if ( !cave ) {

		alert( "failed loading cave information" );
		return;

	}

	Object3D.call( this );

	this.selectedSectionIds = new Set();
	this.selectedSection = 0;
	this.selectedBox = null;
	this.scrapMesh = null;
	this.crossSectionMesh = null;
	this.surveyTree = null;

	// objects targetted by raycasters and objects with variable LOD

	this.mouseTargets = [];
	this.lodTargets = [];

	this.type = "CV.Survey";
	this.cutInProgress = false;
	this.stats = [];
	this.terrain = null;
	this.isRegion = cave.isRegion;
	this.legMeshes = [];
	this.workerPool = new WorkerPool( "caveWorker.js" );

	var self = this;

	var survey = cave.getSurvey();

	this.name = survey.title;

	_loadEntrances( survey.entrances );

	if ( this.isRegion === true ) {

		this.stats[ NORMAL ] = {};
		this.surveyTree = survey.surveyTree;
		this.limits = cave.getLimits();

	} else { 

		this.loadCave( survey );
		this.limits = this.getBounds();

	}

	this.setFeatureBox();

	this.addEventListener( "removed", _onSurveyRemoved );

	return;

	function _onSurveyRemoved( event ) {

		var survey = event.target;

		if ( survey.cutInProgress ) {

			// avoid disposal phase when a cut operation is taking place.
			// this survey is being redisplayed.

			survey.cutInProgress = false;

			return;

		}

		survey.removeEventListener( 'removed', _onSurveyRemoved );

		survey.traverse( _dispose );

		function _dispose( object ) {

			if ( object.geometry ) object.geometry.dispose();

		}

	}

	function _loadEntrances ( entranceList ) {

		var l = entranceList.length;

		if ( l === 0 ) return null;

		var entrances = new Group();

		entrances.name = "CV.Survey:entrances";
		entrances.layers.set( FEATURE_ENTRANCES );

		self.add( entrances );
		self.layers.enable( FEATURE_ENTRANCES );

		for ( var i = 0; i < l; i++ ) {

			var entrance = entranceList[ i ];

			var marker = new Marker( self, entrance );

			entrances.add( marker );

			marker.userData = entrance.survey;

			self.mouseTargets.push( marker );
			self.lodTargets.push( marker );

		}

		return;

	}

}

Survey.prototype = Object.create( Object3D.prototype );

Survey.prototype.constructor = Survey;

Survey.prototype.loadCave = function ( cave ) {

	var self = this;

	_restoreSurveyTree( cave.surveyTree );

	_loadSegments( cave.lineSegments );
	_loadScraps( cave.scraps );
	_loadCrossSections( cave.crossSections );
	_loadTerrain( cave );

	return;

	function _restoreSurveyTree( surveyTree ) {

		if ( surveyTree.forEachChild === undefined ) {
	
			// surveyTree from worker loading  - add Tree methods to all objects in tree.

			Object.assign( surveyTree, Tree.prototype );

			surveyTree.forEachChild( _restore,  true );
		}


		if ( self.surveyTree === null ) {

			self.surveyTree = surveyTree;

		} else {

			self.surveyTree.children.push( surveyTree );

		}

		return;

		function _restore ( child ) {

			Object.assign( child, Tree.prototype );

		}

	}

	function _loadScraps ( scrapList ) {

		var geometry = ( self.scrapMesh === null ) ? new Geometry() : _replaceGeometry( self.scrapMesh );
		var vertices = geometry.vertices;
		var faces    = geometry.faces;

		var vertexOffset = vertices.length
		var facesOffset  = faces.length;
		var faceRuns     = [];

		var l = scrapList.length;

		if ( l === 0 ) return null;

		for ( var i = 0; i < l; i++ ) {

			_loadScrap(  scrapList[i] );

		}

		if ( self.scrapMesh === null ) {

			geometry.name = "CV.Survey:faces:scraps:g";

			var mesh = new Mesh( geometry );

			mesh.name = "CV.Survey:faces:scraps";
			mesh.layers.set( FACE_SCRAPS );
			mesh.userData = faceRuns;

			self.add( mesh );
			self.layers.enable( FACE_SCRAPS );

			self.scrapMesh = mesh;

		} else {

			mesh = self.scrapMesh;

			mesh.userData = mesh.userData.concat( faceRuns );

		}

		geometry.computeFaceNormals();
		geometry.computeBoundingBox();

		return;

		function _loadScrap ( scrap ) {

			var i, l;

			for ( i = 0, l = scrap.vertices.length; i < l; i++ ) {

				var vertex = scrap.vertices[ i ];

				geometry.vertices.push( new Vector3( vertex.x, vertex.y, vertex.z ) );

			}

			for ( i = 0, l = scrap.faces.length; i < l; i++ ) {

				var face = scrap.faces[ i ];

				geometry.faces.push( new Face3( face[0] + vertexOffset, face[1] + vertexOffset, face[2] + vertexOffset ) );

			}

			var end = facesOffset + scrap.faces.length;

			faceRuns.push( { start: facesOffset , end: end, survey: scrap.survey } );
			facesOffset = end;

			vertexOffset += scrap.vertices.length;

		}

	}

	function _loadCrossSections ( crossSectionGroups ) {

		var geometry = ( self.crossSectionMesh === null ) ? new Geometry() : _replaceGeometry( self.crossSectionMesh );

		var faces    = geometry.faces;
		var vertices = geometry.vertices;

		var v = vertices.length;
		var l = crossSectionGroups.length;

		// survey to face index mapping 
		var currentSurvey;
		var faceRuns = [];
		var faceSet  = 0;
		var lastEnd  = faces.length;
		var l1, r1, u1, d1, l2, r2, u2, d2;

		var run = null;

		if ( l === 0 ) return;

		for ( var i = 0; i < l; i++ ) {

			var crossSectionGroup = crossSectionGroups[ i ];
			var m = crossSectionGroup.length;

			if ( m < 2 ) continue;

			// enter first station vertices - FIXME use fudged approach vector for this (points wrong way).
			var lrud = _getLRUD( crossSectionGroup[ 0 ] );

			vertices.push( lrud.l );
			vertices.push( lrud.r );
			vertices.push( lrud.u );
			vertices.push( lrud.d );

			for ( var j = 0; j < m; j++ ) {

				var survey = crossSectionGroup[ j ].survey;
				var lrud = _getLRUD( crossSectionGroup[ j ] );

				if ( survey !== currentSurvey ) {

					currentSurvey = survey;

					if ( run !== null ) {

						// close section with two triangles to form cap.
						faces.push( new Face3( u2, r2, d2 ) );
						faces.push( new Face3( u2, d2, l2 ) );

						lastEnd = lastEnd + faceSet * 8 + 4;

						run.end = lastEnd;
						faceRuns.push( run );

						run = null;
						faceSet = 0;

					}

				}

				faceSet++;

				// next station vertices
				vertices.push( lrud.l );
				vertices.push( lrud.r );
				vertices.push( lrud.u );
				vertices.push( lrud.d );

				// triangles to form passage box
				var l1 = v++;
				var r1 = v++;
				var u1 = v++;
				var d1 = v++;

				var l2 = v++;
				var r2 = v++;
				var u2 = v++;
				var d2 = v++;

				// all face vertices specified in CCW winding order to define front side.

				// top faces
				faces.push( new Face3( u1, r1, r2 ) );
				faces.push( new Face3( u1, r2, u2 ) );
				faces.push( new Face3( u1, u2, l2 ) );
				faces.push( new Face3( u1, l2, l1 ) );

				// bottom faces
				faces.push( new Face3( d1, r2, r1 ) );
				faces.push( new Face3( d1, d2, r2 ) );
				faces.push( new Face3( d1, l2, d2 ) );
				faces.push( new Face3( d1, l1, l2 ) );

				v = v - 4; // rewind to allow current vertices to be start of next box section.

				if ( run === null ) {

					// handle first section of run

					//  start tube with two triangles to form cap
					faces.push( new Face3( u1, r1, d1 ) );
					faces.push( new Face3( u1, d1, l1 ) );

					run = { start: lastEnd, survey: survey };

				}

			}

			currentSurvey = null;
			v = v + 4; // advance because we are starting a new set of independant x-sections.

		}

		if ( run !== null ) {

			// close tube with two triangles
			faces.push( new Face3( u2, r2, d2 ) );
			faces.push( new Face3( u2, d2, l2 ) );

			run.end = lastEnd + faceSet * 8 + 4;
			faceRuns.push( run );

		}

		l = faces.length;
		
		if ( l === 0 ) return;

		for ( i = 0; i < l; i++ ) {

			faces[ i ].color =  new Color( 0x00ffff );

		}

		if ( self.crossSectionMesh === null ) {

			geometry.name = "CV.Survey:faces:walls:g";

			var mesh = new Mesh( geometry, new MeshBasicMaterial( { color: 0xff0000, vertexColors: NoColors, side: FrontSide } ) );

			mesh.userData = faceRuns;
			mesh.name = "CV.Survey:faces:walls";
			mesh.layers.set( FACE_WALLS );

			self.add( mesh );
			self.layers.enable( FACE_WALLS );

			self.crossSectionMesh = mesh;

		} else {

			mesh = self.crossSectionMesh;
			mesh.userData = mesh.userData.concat( faceRuns );

		}

		geometry.computeVertexNormals();
		geometry.computeBoundingBox();

		return;

		function _getLRUD ( crossSection ) {

			var station  = crossSection.end;
			var lrud     = crossSection.lrud;
			var cross    = _getCrossProduct( crossSection );
			var stationV = new Vector3( station.x, station.y, station.z );

			var L = cross.clone().setLength(  lrud.l ).add( stationV );
			var R = cross.clone().setLength( -lrud.r ).add( stationV ); 

			var U = new Vector3( station.x, station.y, station.z + lrud.u );
			var D = new Vector3( station.x, station.y, station.z - lrud.d );

			return { l: L, r: R, u: U, d: D };

		}

		// derive vector in LR direction perpendicular to approach leg and up axis
		function _getCrossProduct ( crossSection ) {

			var s1 = crossSection.start;
			var s2 = crossSection.end;

			return new Vector3( s1.x - s2.x, s1.y - s2.y, s1.z - s2.z ).cross( upAxis );

		}

	}

	function _loadSegments ( srcSegments ) {

		var legGeometries = [];
		var legStats      = [];
		var legRuns       = [];
		var legMeshes     = self.legMeshes;

		legGeometries[ NORMAL  ] = ( legMeshes[ NORMAL  ] === undefined ) ? new Geometry() : _replaceGeometry( legMeshes[ NORMAL  ] );
		legGeometries[ SURFACE ] = ( legMeshes[ SURFACE ] === undefined ) ? new Geometry() : _replaceGeometry( legMeshes[ SURFACE ] );
		legGeometries[ SPLAY   ] = ( legMeshes[ SPLAY   ] === undefined ) ? new Geometry() : _replaceGeometry( legMeshes[ SPLAY   ] );

		legRuns[ NORMAL  ] = ( legMeshes[ NORMAL  ] === undefined ) ? [] : legMeshes[ NORMAL  ].userData;
		legRuns[ SURFACE ] = ( legMeshes[ SURFACE ] === undefined ) ? [] : legMeshes[ SURFACE ].userData;
		legRuns[ SPLAY   ] = ( legMeshes[ SPLAY   ] === undefined ) ? [] : legMeshes[ SPLAY   ].userData;

		var geometry;

		var ballGeometry = self.ballGeometry;

		var currentType;
		var currentSurvey;

		var run;

		var l = srcSegments.length;

		if ( l === 0 ) return null;

		for ( var i = 0; i < l; i++ ) {

			var leg    = srcSegments[ i ];

			var type   = leg.type;
			var survey = leg.survey;

			var vertex1 = new Vector3( leg.from.x, leg.from.y, leg.from.z );
			var vertex2 = new Vector3( leg.to.x,   leg.to.y,   leg.to.z );

			geometry = legGeometries[ type ];

			if ( geometry === undefined ) {

				console.log( "unknown segment type: ", type );
				break;
 
			}

			if ( survey !== currentSurvey || type !== currentType ) {

				// complete last run data

				if ( run !== undefined ) {

					run.end = legGeometries[ currentType ].vertices.length / 2;

					legRuns[ currentType ].push( run );

				}

				// start new run

				run = {};

				run.survey = survey;
				run.start  = geometry.vertices.length / 2;

				currentSurvey = survey;
				currentType   = type;

			}

			geometry.vertices.push( vertex1 );
			geometry.vertices.push( vertex2 );

			geometry.colors.push( ColourCache.white );
			geometry.colors.push( ColourCache.white );

		}

		// add vertices run for last survey section encountered

		if ( run.end === undefined ) {

			run.end = legGeometries[ type ].vertices.length / 2;
			legRuns[ type ].push( run );

		}

		_addModelSegments( NORMAL  , "CV.Survey:legs:cave:cave",       LEG_CAVE );
		_addModelSegments( SURFACE , "CV.Survey:legs:surface:surface", LEG_SURFACE );
		_addModelSegments( SPLAY   , "CV.Survey:legs:cave:splay",      LEG_SPLAY );

		self.stats = legStats;

		return;

		function _addModelSegments ( tag, name, layerTag ) {

			var geometry = legGeometries[ tag ];
			var mesh;

			if ( geometry.vertices.length === 0 ) return;

			if ( legMeshes[ tag ] === undefined ) {

				geometry.name = name + ":g";

				mesh = new LineSegments( geometry, new LineBasicMaterial( { color: 0x88FF88, vertexColors: VertexColors } ) );

				mesh.name = name;
				mesh.userData = legRuns[ tag ];

				mesh.layers.set( layerTag );

				self.add( mesh );
				self.layers.enable( layerTag );

				legMeshes[ tag ] = mesh;

			} else {

				mesh = legMeshes[ tag ];

				mesh.userData = mesh.userData.concat( legRuns[ tag ] );

			}

			geometry.computeBoundingBox();

			legStats[ tag ] = self.getLegStats( mesh );

		}

	}

	function _loadTerrain ( cave ) {

		if ( cave.hasTerrain === false ) {

			self.terrain = null;
			return;

		}

		var dim = cave.getTerrainDimensions();

		var width  = ( dim.samples - 1 ) * dim.xDelta;
		var height = ( dim.lines   - 1 ) * dim.yDelta;

		var plane = new PlaneGeometry( width, height, dim.samples - 1, dim.lines - 1 );

		plane.translate( dim.xOrigin + width / 2, dim.yOrigin + height / 2, 0 );

		self.terrain =  new Terrain().addTile( plane, cave.getTerrainData(), cave.getTerrainBitmap() );

		return;

	}

	function _replaceGeometry( mesh ) {

		var oldGeometry = mesh.geometry;
		var newGeometry = oldGeometry.clone();

		mesh.geometry = newGeometry;

		oldGeometry.dispose();

		return newGeometry;

	}

}

Survey.prototype.loadFromEntrance = function ( entrance, loadedCallback ) {

	var self = this;
	var name = entrance.name.split( "." )[0] + ".3d";
	var prefix = getEnvironmentValue( "surveyDirectory", "" );

	if ( entrance.loaded ) return;

	entrance.loaded = true;

	console.log( "load: ", name );

	var worker = this.workerPool.getWorker();

	worker.onmessage = _surveyLoaded;

	worker.postMessage( prefix + name );

	return;

	function _surveyLoaded ( event ) {

		var surveyData = event.data; // FIXME check for ok;

		self.workerPool.putWorker( worker );

		self.loadCave( surveyData.survey );

		loadedCallback();

	}

}

Survey.prototype.getTerrain = function () {

	return this.terrain;

}

Survey.prototype.getSurveyTree = function () {

	return this.surveyTree;

}

Survey.prototype.getSelectedBox = function () {

	return this.selectedBox;

}

Survey.prototype.getStats = function () {

	return this.stats[ NORMAL ];

}

Survey.prototype.getLegs = function () {

	return this.legMeshes[ NORMAL ].geometry.vertices;

}

Survey.prototype.clearSectionSelection = function () {

	this.selectedSection = 0;
	this.selectedSectionIds.clear();

	var box = this.selectedBox;

	if ( box !== null ) {

		this.remove( box );
		this.selectedBox = null;

		box.geometry.dispose();

	}

}

Survey.prototype.selectSection = function ( id ) {

	var selectedSectionIds = this.selectedSectionIds;
	var surveyTree = this.surveyTree;

	selectedSectionIds.clear();

	if ( id ) surveyTree.getSubtreeIds( id, selectedSectionIds );

	this.selectedSection = id;

}

Survey.prototype.setFeatureBox = function () {

	var box = new BoxHelper( this.limits, 0xffffff );

	box.layers.set( FEATURE_BOX );
	box.name = "survey-boundingbox";

	this.add( box );

}

Survey.prototype.getLegStats = function ( mesh ) {

	if ( !mesh ) return;

	var stats = { maxLegLength: -Infinity, minLegLength: Infinity, legCount: 0, legLength: 0 };
	var vertices = mesh.geometry.vertices;

	var vertex1, vertex2, legLength;

	var l = vertices.length;

	for ( var i = 0; i < l; i += 2 ) {

		vertex1 = vertices[ i ];
		vertex2 = vertices[ i + 1 ];

		var legLength = Math.abs( vertex1.distanceTo( vertex2 ) );

		stats.legLength = stats.legLength + legLength;

		stats.maxLegLength = Math.max( stats.maxLegLength, legLength );
		stats.minLegLength = Math.min( stats.minLegLength, legLength );

	}

	stats.legLengthRange = stats.maxLegLength - stats.minLegLength;
	stats.legCount = l / 2;

	return stats;

}

Survey.prototype.cutSection = function ( id ) {

	var selectedSectionIds = this.selectedSectionIds;
	var self = this;
	var legMeshes = this.legMeshes;

	if ( selectedSectionIds.size === 0 ) return;

	// clear target lists

	this.mouseTargets = [];
	this.lodTargets   = [];

	// iterate through objects replace geometries and remove bounding boxes;

	this.traverseReverse( _cutObject );
	this.clearSectionSelection();

	// update stats

	this.stats[ NORMAL  ] = this.getLegStats( this.legMeshes[ NORMAL  ] );
	this.stats[ SURFACE ] = this.getLegStats( this.legMeshes[ SURFACE ] );
	this.stats[ SPLAY   ] = this.getLegStats( this.legMeshes[ SPLAY   ] );

	this.limits = this.getBounds();

	this.setFeatureBox();

	this.surveyTree = this.surveyTree.findById( id );

	this.clearSectionSelection();

	this.cutInProgress = true;

	return;

	function _cutObject( obj ) {

		var parent;

		switch ( obj.type ) {

		case "CV.Marker":

			if ( selectedSectionIds.has( obj.userData ) ) {

				self.mouseTargets.push( obj );
				self.lodTargets.push( obj );

			} else {

				obj.traverseReverse( _remove );

			}

			break;

		case "LineSegments":

			_cutLineGeometry( obj );

			break;

		case "Mesh":

			_cutMeshGeometry( obj );

			break;

		case "BoxHelper":

			obj.traverseReverse( _remove );

			break;

		default:

			console.log("unexpected object type in survey cut", obj.type );

		}

	}

	function _remove ( obj ) {

		var parent;

		parent = obj.parent;
		parent.remove( obj );

		if ( obj.geometry ) obj.geometry.dispose();

	}

	function _cutLineGeometry ( mesh ) {

		var vertexRuns = mesh.userData;

		if ( ! vertexRuns ) return;

		var geometry   = mesh.geometry;

		var vertices = geometry.vertices;
		var colors   = geometry.colors;

		var runsSelected = 0;
		var selectedSectionIds = self.selectedSectionIds;

		var newGeometry   = new Geometry();

		var newVertices   = newGeometry.vertices;
		var newColors     = newGeometry.colors;
		var newVertexRuns = [];

		var k;
		var vp = 0;

		for ( var run = 0, l = vertexRuns.length; run < l; run++ ) {

			var vertexRun = vertexRuns[ run ];
			var survey    = vertexRun.survey;
			var start     = vertexRun.start;
			var end       = vertexRun.end;

			if ( selectedSectionIds.has( survey ) ) {

				for ( var v = start; v < end; v++ ) {

					k = v * 2;

					newVertices.push( vertices[ k ] );
					newVertices.push( vertices[ k + 1 ] );

					newColors.push( colors[ k ] );
					newColors.push( colors[ k + 1 ] );

				}

				// adjust vertex run for new vertices and color arrays

				vertexRun.start = vp;

				vp += end - start;

				vertexRun.end = vp;

				newVertexRuns.push( vertexRun );

			}

		}

		if ( newGeometry.vertices.length === 0 ) {

				// this type of leg has no instances in selected section.

				self.layers.mask &= ~ mesh.layers.mask; // remove this from survey layer mask

				mesh.parent.remove( mesh );

				return;

		}

		newGeometry.computeBoundingBox();

		mesh.geometry = newGeometry;
		mesh.userData = newVertexRuns;

		geometry.dispose();

	}

	function _cutMeshGeometry ( mesh ) {

		var faceRuns = mesh.userData;

		if ( mesh.name === "" ) return;

		var geometry           = mesh.geometry;

		var faces              = geometry.faces;
		var vertices           = geometry.vertices;

		var	selectedSectionIds = self.selectedSectionIds;

		var newGeometry = new Geometry();

		var newFaces    = newGeometry.faces;
		var newVertices = newGeometry.vertices;

		var newFaceRuns = [];

		var fp = 0;

		var vMap = new Map();
		var face;

		var nextVertex  = 0, vertexIndex;

		for ( var run = 0, l = faceRuns.length; run < l; run++ ) {

			var faceRun = faceRuns[ run ];
			var survey  = faceRun.survey;
			var start   = faceRun.start;
			var end     = faceRun.end;

			if ( selectedSectionIds.has( survey ) ) {

				for ( var f = start; f < end; f++ ) {

					face = faces[ f ];

					// remap face vertices into new vertex array
					face.a = _remapVertex( face.a );
					face.b = _remapVertex( face.b );
					face.c = _remapVertex( face.c );

					newFaces.push( face );

				}

				faceRun.start = fp;

				fp += end - start;

				faceRun.end   = fp;

				newFaceRuns.push( faceRun );

			}

		}

		if ( newGeometry.vertices.length === 0 ) {

				// this type of leg has no instances in selected section.

				self.layers.mask &= ~ mesh.layers.mask; // remove this from survey layer mask

				mesh.parent.remove( mesh );

				return;

		}

		newGeometry.computeFaceNormals();
		newGeometry.computeVertexNormals();
		newGeometry.computeBoundingBox();

		mesh.geometry = newGeometry;
		mesh.userData = newFaceRuns;

		geometry.dispose();

		function _remapVertex( vi ) {

			// see if we have already remapped this vertex index (vi)

			vertexIndex = vMap.get( vi );

			if ( vertexIndex === undefined ) {

				vertexIndex = nextVertex++;

				// insert new index in map
				vMap.set( vi, vertexIndex );

				newVertices.push( vertices[ vi ] );

			}

			return vertexIndex;

		}

	}

}

Survey.prototype.getBounds = function ()  {

	var box = new Box3();

	var min = box.min;
	var max = box.max;

	this.traverse( _addObjectBounds );

	return box;

	function _addObjectBounds ( obj ) {

		if ( obj.type === "CV.EntranceNearPointer" ) return; // skip sprites which have abnormal bounding boxes
		if ( obj.type === "CV.EntranceFarPointer" ) return; // skip sprites which have abnormal bounding boxes

		var geometry = obj.geometry;

		if ( geometry && geometry.boundingBox ) {

			min.min( geometry.boundingBox.min );
			max.max( geometry.boundingBox.max );

		}

	}

}

Survey.prototype.setShadingMode = function ( mode ) {

	var material;
	var self = this;

	switch ( mode ) {

	case SHADING_HEIGHT:

		material = Materials.getHeightMaterial( MATERIAL_SURFACE );

		break;

	case SHADING_CURSOR:

		material = Materials.getCursorMaterial( MATERIAL_SURFACE, 5.0 );

		break;

	case SHADING_SINGLE:

		material = new MeshLambertMaterial( { color: 0xff0000, vertexColors: NoColors } );

		break;

	case SHADING_SURVEY:

		material = new MeshLambertMaterial( { color: 0xffffff, vertexColors: FaceColors } );

		break;

	case SHADING_DEPTH:

		material = Materials.getDepthMaterial( MATERIAL_SURFACE );

		if ( ! material )  return false;

		break;

	}

	if ( this.setLegShading( LEG_CAVE, mode ) ) {

		_setFaceShading( this.getObjectByName( "CV.Survey:faces:walls" ), mode, material );
		_setFaceShading( this.getObjectByName( "CV.Survey:faces:scraps" ), mode, material );

		return true;

	}

	return false;

	function _setFaceShading ( mesh, mode, material ) {

		if ( !mesh ) return;

		if ( material ) {

			self.setFacesSelected( mesh, material, mode );
			mesh.visible = true;

		} else {

			mesh.visible = false;

		}

	}

}

Survey.prototype.setFacesSelected = function ( mesh, selected, mode ) {

	if ( !mesh ) return;

	var faceRuns = mesh.userData;
	var faces    = mesh.geometry.faces;
	var	selectedSectionIds = this.selectedSectionIds;
	var surveyColours;
	var unselected = new MeshLambertMaterial( { side: FrontSide, color: 0x444444, vertexColors: FaceColors } );

	if ( mode === SHADING_SURVEY ) surveyColours = this.getSurveyColours();

	mesh.material = new MultiMaterial( [ selected, unselected ] );

	var count = 0; // check final face count is select to detect faults in constructed mesh.userData

	if (selectedSectionIds.size && faceRuns) {

		for ( var run = 0, l = faceRuns.length; run < l; run++ ) {

			var faceRun = faceRuns[run];
			var survey  = faceRun.survey;
			var start   = faceRun.start;
			var end     = faceRun.end;

			count = count + end - start;
	
			if ( selectedSectionIds.has( survey ) ) {

				for ( var f = start; f < end; f++ ) {

					faces[ f ].materialIndex = 0;

					if ( mode === SHADING_SURVEY ) {

						faces[ f ].color.copy( surveyColours[ survey ] );

					}

				}

			} else {

				for ( var f = start; f < end; f++ ) {

					faces[ f ].materialIndex = 1;

				}

			}

		}

		if ( faces.length != count ) console.log("error: faces.length", faces.length, "count : ", count ); // TMP ASSERT

	} else {

		for ( var f = 0, end = faces.length; f < end; f++ ) {

			faces[ f ].materialIndex = 0;

		}

	}

	mesh.geometry.groupsNeedUpdate = true;

	if ( mode === SHADING_SURVEY ) mesh.geometry.colorsNeedUpdate = true;

}

Survey.prototype.hasFeature = function ( layerTag ) {

	return !( ( this.layers.mask & 1 << layerTag ) === 0 );

}

Survey.prototype.setLegShading = function ( legType, legShadingMode ) {

	var mesh;

	switch ( legType ) {

	case LEG_CAVE:

		mesh = this.legMeshes[ NORMAL ];

		break;

	case LEG_SPLAY:

		mesh = this.legMeshes[ SPLAY ];

		break;

	case LEG_SURFACE:

		mesh = this.legMeshes[ SURFACE ];

		break;

	default:

		console.log( "invalid leg type" );

		return;

	}

	if ( mesh === undefined ) return;

	switch ( legShadingMode ) {

	case SHADING_HEIGHT:

		this.setLegColourByHeight( mesh );

		break;

	case SHADING_LENGTH:

		this.setLegColourByLength( mesh );

		break;

	case SHADING_INCLINATION:

		this.setLegColourByInclination( mesh, upAxis );

		break;

	case SHADING_CURSOR:

		this.setLegColourByCursor( mesh );

		break;

	case SHADING_SINGLE:

		this.setLegColourByColour( mesh, ColourCache.red );

		break;

	case SHADING_SURVEY:

		this.setLegColourBySurvey( mesh );

		break;

	case SHADING_OVERLAY:

		break;

	case SHADING_SHADED:

		break;

	case SHADING_DEPTH:

		this.setLegColourByDepth( mesh );

		break;

	default:

		console.log( "invalid leg shading mode" );

		return false;

	}

	return true;

}

Survey.prototype.getSurveyColour = function ( surveyId ) {

	var surveyColours = ColourCache.survey;

	return surveyColours[ surveyId % surveyColours.length ];

}

Survey.prototype.getSurveyColours = function () { // FIXME - cache save recalc for faces and lines,

	var survey;
	var surveyColours = [];
	var selectedSection    = this.selectedSection;
	var selectedSectionIds = this.selectedSectionIds;
	var surveyTree = this.surveyTree;

	var colour;

	if ( selectedSectionIds.size > 0 && selectedSection !== 0 ) {

		survey = selectedSection;

	} else {

		survey = surveyTree.id;
		surveyTree.getSubtreeIds( survey, selectedSectionIds );

	}

	// create mapping of survey id to colour
	// map each child id _and_ all its lower level survey ids to the same colour

	var children = surveyTree.findById( survey ).children;

	colour = this.getSurveyColour( survey );
	_setSurveyColour( survey );

	for ( var i = 0, l = children.length; i < l; i++ ) {

		var childId    = children[ i ].id;
		var childIdSet = new Set();

		surveyTree.getSubtreeIds( childId, childIdSet );

		colour = this.getSurveyColour( childId );

		childIdSet.forEach( _setSurveyColour );

	}

	return surveyColours;

	function _setSurveyColour ( value ) {

		surveyColours[ value ] = colour;

	}

}

Survey.prototype.setEntrancesSelected = function () {

	var entrances = this.getObjectByName( "CV.Survey:entrances" );

	if ( !entrances ) return;

	var children = entrances.children;
	var selectedSectionIds = this.selectedSectionIds;
	var boundingBox = null;

	if ( selectedSectionIds.size > 0 ) {

		boundingBox = new Box3();

		for ( var i = 0, l = children.length; i < l; i++ ) {

			var entrance = children[ i ];

			if ( selectedSectionIds.has( entrance.userData ) ) {

				entrance.visible = true;
				boundingBox.expandByPoint( entrance.position );

			} else {

				entrance.visible = false;

			}

		}

	} else {

		for ( var i = 0, l = children.length; i < l; i++ ) {

			var entrance = children[ i ];

			entrance.visible = true;

		}

	}

	return boundingBox;

}

Survey.prototype.setLegColourByMaterial = function ( mesh, material ) {

	mesh.material = material;
	mesh.material.needsUpdate = true;

	this.setLegSelected( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2 ) {

		geometry.colors[ v1 ] = ColourCache.white;
		geometry.colors[ v2 ] = ColourCache.white;

	}

}

Survey.prototype.setLegColourByDepth = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getDepthMaterial( MATERIAL_LINE ) );

}

Survey.prototype.setLegColourByHeight = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getHeightMaterial( MATERIAL_LINE ) );

}

Survey.prototype.setLegColourByCursor = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getCursorMaterial( MATERIAL_LINE, 5.0 ) );

}

Survey.prototype.setLegColourByColour = function ( mesh, colour ) {

	mesh.material = Materials.getLineMaterial();

	this.setLegSelected( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2 ) {

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

}

Survey.prototype.setLegColourByLength = function ( mesh ) {

	var colours = ColourCache.gradient;
	var colourRange = colours.length - 1;
	var stats = this.getStats();

	mesh.material = Materials.getLineMaterial();

	this.setLegSelected( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2 ) {

		var vertex1 = geometry.vertices[ v1 ];
		var vertex2 = geometry.vertices[ v2 ];

		var relLength = ( Math.abs( vertex1.distanceTo( vertex2 ) ) - stats.minLegLength ) / stats.legLengthRange;
		var colour = colours[ Math.floor( ( 1 - relLength ) * colourRange ) ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

}

Survey.prototype.setLegColourBySurvey = function ( mesh ) {

	var surveyColours = this.getSurveyColours();

	mesh.material = Materials.getLineMaterial();

	this.setLegSelected ( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2, survey ) {

		var colour = surveyColours[ survey ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

}

Survey.prototype.setLegColourByInclination = function ( mesh, pNormal ) {

	var colours = ColourCache.inclination;
	var colourRange = colours.length - 1;

	// pNormal = normal of reference plane in model space 

	mesh.material = Materials.getLineMaterial();

	this.setLegSelected ( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2 ) {

		var vertex1 = geometry.vertices[ v1 ];
		var vertex2 = geometry.vertices[ v2 ];

		var legNormal  = new Vector3().subVectors( vertex1, vertex2 ).normalize();
		var dotProduct = legNormal.dot( pNormal );

		var hueIndex = Math.floor( colourRange * 2 * Math.acos( Math.abs( dotProduct ) ) / Math.PI );
		var colour   = colours[ hueIndex ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

}

Survey.prototype.setLegSelected = function ( mesh, colourSegment ) {

	// pNormal = normal of reference plane in model space 
	var geometry   = mesh.geometry;
	var vertexRuns = mesh.userData;

	var vertices = geometry.vertices;
	var colors   = geometry.colors;

	var box = new Box3();

	var min = box.min;
	var max = box.max;

	var runsSelected = 0;

	var k;

	var selectedSectionIds = this.selectedSectionIds;

	if ( selectedSectionIds.size && vertexRuns ) {

		for ( var run = 0, l = vertexRuns.length; run < l; run++ ) {

			var vertexRun = vertexRuns[ run ];
			var survey    = vertexRun.survey;
			var start     = vertexRun.start;
			var end       = vertexRun.end;

			if ( selectedSectionIds.has( survey ) ) {

				runsSelected++;

				for ( var v = start; v < end; v++ ) {

					k = v * 2;

					var v1 = vertices[ k ];
					var v2 = vertices[ k + 1 ];

					colourSegment( geometry, k, k + 1, survey );

					min.min( v1 );
					min.min( v2 );
					max.max( v1 );
					max.max( v2 );

				}

			} else {

				for ( var v = start; v < end; v++ ) {

					k = v*2;

					var v1 = vertices[ k ];
					var v2 = vertices[ k + 1 ];

					colors[ k ]     = ColourCache.grey;
					colors[ k + 1 ] = ColourCache.grey;

				}

			}

		}

		if ( this.selectedSection > 0 && runsSelected > 0 ) {

			this.selectedBox = new BoxHelper( box, 0x0000ff );

			this.selectedBox.layers.set( FEATURE_SELECTED_BOX );
			this.selectedBox.name = "selectedBox";

			this.add( this.selectedBox );

		}

	} else {

		for ( var v = 0, l = geometry.vertices.length / 2; v < l; v++ ) {

			var k  = v * 2;

			colourSegment( geometry, k, k + 1 );

		}

	}

	geometry.colorsNeedUpdate = true; 

}

export { Survey };

// EOF