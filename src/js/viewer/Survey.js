
import {
	FACE_SCRAPS, FACE_WALLS,
	FEATURE_ENTRANCES, FEATURE_SELECTED_BOX, FEATURE_BOX, FEATURE_TRACES,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE,
	MATERIAL_LINE, MATERIAL_SURFACE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_OVERLAY, 
	SHADING_SURVEY, SHADING_SINGLE, SHADING_SHADED, SHADING_PATH, SHADING_DEPTH_CURSOR,
	upAxis
} from '../core/constants';

import { replaceExtension, getEnvironmentValue } from '../core/lib';
import { ColourCache } from '../core/ColourCache';
import { Tree } from '../core/Tree';
import { Box3Helper } from '../core/Box3';
import { Materials } from '../materials/Materials';
import { ClusterMarkers } from './ClusterMarkers';
import { Stations } from './Stations';
import { Routes } from './Routes';
import { Walls } from './Walls';
import { DyeTraces } from './DyeTraces';
import { SurveyColours } from '../core/SurveyColours';
import { Terrain } from '../terrain/Terrain';
import { WorkerPool } from '../workers/WorkerPool';
import { TerrainTileGeometry }  from '../terrain/TerrainTileGeometry';

import {
	Vector3, Box3,
	Geometry,
	MeshLambertMaterial, LineBasicMaterial,
	NoColors, VertexColors,
	Object3D, LineSegments,
	Points, PointsMaterial
} from '../../../../three.js/src/Three';

var zeroVector = new Vector3();

function Survey ( cave ) {

	if ( ! cave ) {

		alert( 'failed loading cave information' );
		return;

	}

	Object3D.call( this );

	this.selectedSectionIds = new Set();
	this.selectedSection = 0;
	this.selectedBox = null;
	this.highlightBox = null;
	this.featureBox = null;
	this.surveyTree = null;
	this.projection = null;

	// objects targetted by raycasters and objects with variable LOD

	this.pointTargets = [];
	this.legTargets = [];

	this.type = 'CV.Survey';
	this.cutInProgress = false;
	this.stats = [];
	this.terrain = null;
	this.isRegion = cave.isRegion;
	this.legMeshes = [];
	this.routes = null;
	this.stations = null;
	this.workerPool = new WorkerPool( 'caveWorker.js' );

	// highlit point marker

	var g = new Geometry();
	g.vertices.push( new Vector3() );

	var point = new Points( g, new PointsMaterial( { color: 0xffffff } ) );

	point.visible = false;

	this.add( point );

	this.stationHighlight = point;

	var self = this;

	SurveyColours.clearMap(); // clear cache of survey section to colour

	var survey = cave.getSurvey();

	this.name = survey.title;
	this.CRS = ( survey.sourceCRS === null ) ? getEnvironmentValue( 'CRS', 'fred' ) : survey.sourceCRS;

	this.isLongLat = true; // FIXME

	if ( this.isRegion === true ) {

		this.stats[ LEG_CAVE ] = {};
		this.surveyTree = survey.surveyTree;
		this.limits = cave.getLimits();

	} else { 

		this.loadCave( survey );
		this.limits = this.getBounds();

		this.legTargets = [ this.legMeshes[ LEG_CAVE ] ];

	}

	this.entrances = new ClusterMarkers( this.limits, 4 );

	_loadEntrances( survey.entrances );

	this.setFeatureBox();

	_setProjectionScale();

	this.addEventListener( 'removed', _onSurveyRemoved );

	return;

	function _setProjectionScale () {

		// calculate scaling distortion if we have required CRS definitions

		if ( survey.sourceCRS === null || survey.targetCRS === null ) {

			self.scaleFactor = 1;

			return;

		}

		var p1 = self.limits.min.clone();
		var p2 = self.limits.max.clone();

		p1.z = 0;
		p2.z = 0;

		var l1 = p1.distanceTo( p2 );

		var transform = proj4( survey.targetCRS, survey.sourceCRS ); // eslint-disable-line no-undef

		p1.copy( transform.forward( p1 ) );
		p2.copy( transform.forward( p2 ) );

		self.projection = transform;

		var l2 = p1.distanceTo( p2 );

		self.scaleFactor = l1 / l2;

	}

	function _onSurveyRemoved ( event ) {

		var survey = event.target;

		if ( survey.cutInProgress ) {

			// avoid disposal phase when a cut operation is taking place.
			// this survey is being redisplayed.

			survey.cutInProgress = false;

			return;

		}

		survey.removeEventListener( 'removed', _onSurveyRemoved );

		survey.traverse( _dispose );

		this.remove( this.stations );

		function _dispose ( object ) {

			if ( object.geometry ) object.geometry.dispose();

		}

	}

	function _loadEntrances ( entranceList ) {

		var l = entranceList.length;

		if ( l === 0 ) return null;

		var marker;
		var entrances = self.entrances;

		entrances.name = 'CV.Survey:entrances';

		self.add( entrances );
		self.layers.enable( FEATURE_ENTRANCES );

		// remove common elements from station names
		var endNode = self.surveyTree;

		while ( endNode.children.length === 1 ) endNode = endNode.children [ 0 ];

		for ( var i = 0; i < l; i++ ) {

			var node = self.surveyTree.findById( entranceList[ i ] );

			marker = entrances.addMarker( node.p, node.getPath( endNode ) );

			self.limits.expandByPoint( marker.position );

			self.pointTargets.push( marker );

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

	this.loadStations( cave.surveyTree );

	_loadScraps( cave.scraps );
	_loadCrossSections( cave.crossSections );
	_loadTerrain( cave );

	this.computeBoundingBoxes( cave.surveyTree );

	this.pointTargets.push( this.stations );

	if ( cave.metadata ) {

		if ( cave.metadata.routes ) {

			this.routes = new Routes( cave.metadata.routes ).mapSurvey( this.stations, this.getLegs(), this.surveyTree );

		}

		if ( cave.metadata.traces ) {

			this.loadDyeTraces( cave.metadata.traces );

		}

	}

	return;

	function _restoreSurveyTree ( surveyTree ) {

		if ( surveyTree.forEachChild === undefined ) {
	
			// surveyTree from worker loading - add Tree methods to all objects in tree.

			_restore( surveyTree );

			surveyTree.forEachChild( _restore, true );

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

	function _loadScraps ( scrapList ) { // FIXME - sort out faceRuns -> indexRuns

		var l = scrapList.length;

		if ( l === 0 ) return null;

		var mesh = self.getMesh( FACE_SCRAPS );

		var indices = [];
		var vertices = [];

		var indexRuns = [];

		var vertexOffset = 0;
		var lastEnd = 0;

		for ( var i = 0; i < l; i++ ) {

			_loadScrap( scrapList[ i ] );

		}

		mesh.addWalls( vertices, indices, indexRuns );

		self.addMesh( mesh, FACE_SCRAPS, 'CV.Survey:faces:scraps' );

		return;

		function _loadScrap ( scrap ) {

			var i, l;

			for ( i = 0, l = scrap.vertices.length; i < l; i++ ) {

				var vertex = scrap.vertices[ i ];

				vertices.push( new Vector3( vertex.x, vertex.y, vertex.z ) );

			}

			for ( i = 0, l = scrap.faces.length; i < l; i++ ) {

				var face = scrap.faces[ i ];

				indices.push( face[ 0 ] + vertexOffset, face[ 2 ] + vertexOffset, face[ 1 ] + vertexOffset );

			}

			var end = indices.length;

			indexRuns.push( { start: lastEnd, count: end - lastEnd, survey: scrap.survey } );
			lastEnd = end;

			vertexOffset += scrap.vertices.length;

		}

	}

	function _loadCrossSections ( crossSectionGroups ) {

		var mesh = self.getMesh( FACE_WALLS );

		var indices = [];
		var vertices = [];

		var v = 0;
		var l = crossSectionGroups.length;

		// survey to face index mapping 
		var currentSurvey;
		var indexRuns = [];

		var lastEnd = 0;
		var l1, r1, u1, d1, l2, r2, u2, d2, lrud;
		var i, j;

		var cross = new Vector3();
		var lastCross = new Vector3();

		var run = null;

		if ( l === 0 ) return;

		for ( i = 0; i < l; i++ ) {

			var crossSectionGroup = crossSectionGroups[ i ];
			var m = crossSectionGroup.length;

			if ( m < 2 ) continue;

			// enter first station vertices - FIXME use fudged approach vector for this (points wrong way).
			lrud = _getLRUD( crossSectionGroup[ 0 ] );

			vertices.push( lrud.l );
			vertices.push( lrud.r );
			vertices.push( lrud.u );
			vertices.push( lrud.d );

			for ( j = 0; j < m; j++ ) {

				var survey = crossSectionGroup[ j ].survey;

				lrud = _getLRUD( crossSectionGroup[ j ] );

				if ( survey !== currentSurvey ) {

					currentSurvey = survey;

					if ( run !== null ) {

						// close section with two triangles to form cap.
						indices.push( u2, r2, d2 );
						indices.push( u2, d2, l2 );

						lastEnd = indices.length;

						run.count = lastEnd - run.start;

						indexRuns.push( run );

						run = null;

					}

				}

				// next station vertices
				vertices.push( lrud.l );
				vertices.push( lrud.r );
				vertices.push( lrud.u );
				vertices.push( lrud.d );

				// triangles to form passage box
				l1 = v++;
				r1 = v++;
				u1 = v++;
				d1 = v++;

				l2 = v++;
				r2 = v++;
				u2 = v++;
				d2 = v++;

				// all face vertices specified in CCW winding order to define front side.

				// top faces
				indices.push( u1, r1, r2 );
				indices.push( u1, r2, u2 );
				indices.push( u1, u2, l2 );
				indices.push( u1, l2, l1 );

				// bottom faces
				indices.push( d1, r2, r1 );
				indices.push( d1, d2, r2 );
				indices.push( d1, l2, d2 );
				indices.push( d1, l1, l2 );

				v = v - 4; // rewind to allow current vertices to be start of next box section.

				if ( run === null ) {

					// handle first section of run

					run = { start: lastEnd, survey: survey };

					// start tube with two triangles to form cap
					indices.push( u1, r1, d1 );
					indices.push( u1, d1, l1 );


				}

			}

			currentSurvey = null;
			v = v + 4; // advance because we are starting a new set of independant x-sections.

		}

		if ( run !== null ) {

			// close tube with two triangles
			indices.push( u2, r2, d2 );
			indices.push( u2, d2, l2 );

			run.count = indices.length - run.start;

			indexRuns.push( run );

		}

		l = indices.length;

		if ( l === 0 ) return;

		mesh.addWalls( vertices, indices, indexRuns );

		self.addMesh( mesh, FACE_WALLS, 'CV.Survey:faces:walls' );

		return;

		function _getLRUD ( crossSection ) {

			var station  = crossSection.end;
			var lrud     = crossSection.lrud;
			var stationV = new Vector3( station.x, station.y, station.z );

			// cross product of leg and up AXIS to give direction of LR vector
			cross.subVectors( crossSection.start, crossSection.end ).cross( upAxis );

			var L, R, U, D;

			if ( cross.equals( zeroVector ) ) {

				// leg is vertical

				if ( lastCross.equals( zeroVector ) ) {

					// previous leg was vertical

					L = stationV;
					R = stationV;

				} else {

					// use previous leg to determine passage orientation for L and R for vertical legs

					L = lastCross.clone().setLength(  lrud.l ).add( stationV );
					R = lastCross.clone().setLength( -lrud.r ).add( stationV ); 

				}

			} else {

				L = cross.clone().setLength(  lrud.l ).add( stationV );
				R = cross.clone().setLength( -lrud.r ).add( stationV ); 

			}

			U = new Vector3( station.x, station.y, station.z + lrud.u );
			D = new Vector3( station.x, station.y, station.z - lrud.d );

			lastCross.copy( cross );

			return { l: L, r: R, u: U, d: D };

		}

	}

	function _loadSegments ( srcSegments ) {

		var legGeometries = [];
		var legStats      = [];
		var legRuns       = [];
		var legMeshes     = self.legMeshes;

		legGeometries[ LEG_CAVE    ] = self.getLineGeometry( LEG_CAVE );
		legGeometries[ LEG_SURFACE ] = self.getLineGeometry( LEG_SURFACE );
		legGeometries[ LEG_SPLAY   ] = self.getLineGeometry( LEG_SPLAY );

		legRuns[ LEG_CAVE    ] = ( legMeshes[ LEG_CAVE    ] === undefined ) ? [] : legMeshes[ LEG_CAVE    ].userData.legRuns;
		legRuns[ LEG_SURFACE ] = ( legMeshes[ LEG_SURFACE ] === undefined ) ? [] : legMeshes[ LEG_SURFACE ].userData.legRuns;
		legRuns[ LEG_SPLAY   ] = ( legMeshes[ LEG_SPLAY   ] === undefined ) ? [] : legMeshes[ LEG_SPLAY   ].userData.legRuns;

		var geometry;

		var currentType;
		var currentSurvey;

		var run;
		var l = srcSegments.length;

		if ( l === 0 ) return null;

		var vertex1, vertex2;

		var lastVertex = new Vector3();

		for ( var i = 0; i < l; i++ ) {

			var leg = srcSegments[ i ];

			var type   = leg.type;
			var survey = leg.survey;

			// most line segments will share vertices - avoid allocating new Vector3() in this case.

			vertex1 = lastVertex.equals( leg.from ) ? lastVertex : new Vector3( leg.from.x, leg.from.y, leg.from.z );
			vertex2 = new Vector3( leg.to.x,   leg.to.y,   leg.to.z );

			lastVertex = vertex2;

			geometry = legGeometries[ type ];

			if ( geometry === undefined ) {

				console.log( 'unknown segment type: ', type );
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

		_addModelSegments( LEG_CAVE, 'CV.Survey:legs:cave:cave' );
		_addModelSegments( LEG_SURFACE, 'CV.Survey:legs:surface:surface' );
		_addModelSegments( LEG_SPLAY, 'CV.Survey:legs:cave:splay' );

		self.stats = legStats;

		return;

		function _addModelSegments ( tag, name ) {

			var geometry = legGeometries[ tag ];
			var mesh;

			if ( geometry.vertices.length === 0 ) return;

			if ( legMeshes[ tag ] === undefined ) {

				geometry.name = name + ':g';

				mesh = new LineSegments( geometry, new LineBasicMaterial( { color: 0x88FF88, vertexColors: VertexColors } ) );

				mesh.name = name;
				mesh.userData = { legRuns: legRuns[ tag ] };

				mesh.layers.set( tag );

				self.add( mesh );
				self.layers.enable( tag );

				legMeshes[ tag ] = mesh;

			} else {

				mesh = legMeshes[ tag ];

				mesh.userData.legRuns = mesh.userData.legRuns.concat( legRuns[ tag ] );

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

		var terrain = cave.terrain;

		var dim = terrain.dimensions;

		var width  = ( dim.samples - 1 ) * dim.xDelta;
		var height = ( dim.lines   - 1 ) * dim.yDelta;
		var clip = { top: 0, bottom: 0, left: 0, right: 0, dtmOffset: 0 };

		var terrainTileGeometry = new TerrainTileGeometry( width, height, dim.samples - 1, dim.lines - 1, terrain.data, 1, clip );

		terrainTileGeometry.translate( dim.xOrigin, dim.yOrigin + height, 0 );

		self.terrain = new Terrain().addTile( terrainTileGeometry, terrain.bitmap );

		return;

	}

};

Survey.prototype.getMesh = function ( tag ) {

	var mesh = this.legMeshes[ tag ];

	if ( mesh === undefined ) {

		mesh = new Walls( tag );

	}

	return mesh;

};

Survey.prototype.getLineGeometry = function ( tag ) {

	var mesh = this.legMeshes[ tag ];

	if ( mesh === undefined ) {

		return new Geometry();

	} else {

		// swap a new geometry in. (to ensure direct and buffer geometries in three.js are replaced )

		var oldGeometry = mesh.geometry;
		var newGeometry = oldGeometry.clone();

		mesh.geometry = newGeometry;

		oldGeometry.dispose();

		return newGeometry;

	}

};

Survey.prototype.addMesh = function ( mesh, tag, name ) {

	mesh.name = name;

	this.layers.enable( tag );
	this.legMeshes[ tag ] = mesh;

	this.add( mesh );

};

Survey.prototype.loadStations = function ( surveyTree ) {

	var i;

	var stations = new Stations();

	surveyTree.traverse( function _addStation ( node ) { stations.addStation( node ); } );

	var legs = this.getLegs();

	// count number of legs linked to each station

	for ( i = 0; i < legs.length; i++ ) {

		stations.updateStation( legs[ i ] );

	}

	// we have finished adding stations.
	stations.finalise();

	this.add( stations );

	this.stations = stations;

};

Survey.prototype.computeBoundingBoxes = function ( surveyTree ) {

	surveyTree.traverseDepthFirst( _computeBoundingBox );

	return;

	function _computeBoundingBox ( node ) {

		var parent = node.parent;

		if ( parent && parent.boundingBox === undefined ) parent.boundingBox = new Box3();

		if ( node.p !== undefined ) {

			parent.boundingBox.expandByPoint( node.p );

		} else if ( parent ) {

			if ( node.children.length === 0 || ( node.boundingBox !== undefined && node.boundingBox.isEmpty() ) ) return;

			parent.boundingBox.expandByPoint( node.boundingBox.min );
			parent.boundingBox.expandByPoint( node.boundingBox.max );

		}

	}

};

Survey.prototype.loadDyeTraces = function ( traces ) {

	if ( traces.length === 0 ) return;

	var surveyTree = this.surveyTree;
	var dyeTraces = new DyeTraces();

	for ( var i = 0, l = traces.length; i < l; i++ ) {

		var trace = traces[ i ];

		var startStation = surveyTree.getByPath( trace.start );
		var endStation   = surveyTree.getByPath( trace.end );

		if ( endStation === undefined || startStation === undefined ) continue;

		dyeTraces.addTrace( startStation.p, endStation.p );

	}

	dyeTraces.finish();

	this.layers.enable( FEATURE_TRACES );

	this.add( dyeTraces );

	return;

};

Survey.prototype.loadFromEntrance = function ( entrance, loadedCallback ) {

	var self = this;
	var name = replaceExtension( entrance.name, '3d' );
	var prefix = getEnvironmentValue( 'surveyDirectory', '' );

	if ( entrance.loaded ) return;

	entrance.loaded = true;

	console.log( 'load: ', name );

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

};

Survey.prototype.getProjection = function () {

	return this.projection;

};

Survey.prototype.getTerrain = function () {

	return this.terrain;

};

Survey.prototype.getSurveyTree = function () {

	return this.surveyTree;

};

Survey.prototype.getStats = function () {

	return this.stats[ LEG_CAVE ];

};

Survey.prototype.getLegs = function () {

	return this.legMeshes[ LEG_CAVE ].geometry.vertices;

};

Survey.prototype.getRoutes = function () {

	var routes = this.routes;

	if ( routes === null ) {

		routes = new Routes().mapSurvey( this.stations, this.getLegs(), this.surveyTree );

		this.routes = routes;

	}

	return routes;

};

Survey.prototype.setScale = function ( scale ) {

	this.stations.setScale( scale );

};

Survey.prototype.clearSectionSelection = function () {

	this.selectedSection = 0;
	this.selectedSectionIds.clear();

	var box = this.selectedBox;

	if ( box !== null ) box.visible = false;

};

Survey.prototype.boxSection = function ( node, box, colour ) {

	if ( box === null ) {

		box = new Box3Helper( node.boundingBox, colour );

		box.layers.set( FEATURE_SELECTED_BOX );

		this.add( box );

	} else {

		box.visible = true;
		box.update( node.boundingBox );

	}

	return box;

};

Survey.prototype.highlightSection = function ( id ) {

	var surveyTree = this.surveyTree;
	var node;
	var box = this.highlightBox;

	if ( id ) {

		node = surveyTree.findById( id );

		if ( node.p === undefined && node.boundingBox !== undefined ) {

			this.highlightBox = this.boxSection( node, box, 0xffff00 );

		} else if ( node.p ) {

// FIXME - make cleaner and use bufferAttribute
			var highlight = this.stationHighlight;
			var geometry = highlight.geometry;

			geometry.vertices[ 0 ].copy( node.p );
			geometry.verticesNeedUpdate = true;

			highlight.visible = true;

		}

	} else {

		if ( box !== null ) box.visible = false;

	}

};

Survey.prototype.selectSection = function ( id ) {

	var selectedSectionIds = this.selectedSectionIds;
	var surveyTree = this.surveyTree;
	var node;

	if ( id ) {

		node = surveyTree.findById( id );
		selectedSectionIds.clear();

		if ( node.p === undefined && node.boundingBox !== undefined ) {

			this.selectedBox = this.boxSection( node, this.selectedBox, 0x00ff00 );
			surveyTree.getSubtreeIds( id, selectedSectionIds );

		} else {

			// stations cannot be bounded
			id = 0;

		}

	}

	this.selectedSection = id;

	return node;

};

Survey.prototype.setFeatureBox = function () {

	if ( this.featureBox === null ) {

		var box = new Box3Helper( this.limits, 0xffffff );

		box.layers.set( FEATURE_BOX );
		box.name = 'survey-boundingbox';

		this.featureBox = box;
		this.add( box );

	} else {

		this.featureBox.update( this.limits );

	}

};

Survey.prototype.getLegStats = function ( mesh ) {

	if ( ! mesh ) return;

	var stats = { maxLegLength: -Infinity, minLegLength: Infinity, legCount: 0, legLength: 0 };
	var vertices = mesh.geometry.vertices;

	var vertex1, vertex2, legLength;

	var l = vertices.length;

	for ( var i = 0; i < l; i += 2 ) {

		vertex1 = vertices[ i ];
		vertex2 = vertices[ i + 1 ];

		legLength = Math.abs( vertex1.distanceTo( vertex2 ) );

		stats.legLength = stats.legLength + legLength;

		stats.maxLegLength = Math.max( stats.maxLegLength, legLength );
		stats.minLegLength = Math.min( stats.minLegLength, legLength );

	}

	stats.legLengthRange = stats.maxLegLength - stats.minLegLength;
	stats.legCount = l / 2;

	return stats;

};

Survey.prototype.cutSection = function ( id ) {

	var selectedSectionIds = this.selectedSectionIds;
	var self = this;
	var legMeshes = this.legMeshes;

	if ( selectedSectionIds.size === 0 ) return;

	// clear target lists

	this.PointTargets = [];
	this.legTargets   = [];

	// iterate through objects replace geometries and remove bounding boxes;

	var cutList = []; // list of Object3D's to remove from survey - workaround for lack of traverseReverse

	this.traverse( _cutObject );

	for ( var i = 0, l = cutList.length; i < l; i++ ) {

		var obj = cutList[ i ];
		var parent;

		parent = obj.parent;
		if ( parent ) parent.remove( obj );

		// dispose of all geometry of this object and descendants

		if ( obj.geometry ) obj.geometry.dispose();

	}

	// update stats

	this.stats[ LEG_CAVE    ] = this.getLegStats( legMeshes[ LEG_CAVE    ] );
	this.stats[ LEG_SURFACE ] = this.getLegStats( legMeshes[ LEG_SURFACE ] );
	this.stats[ LEG_SPLAY   ] = this.getLegStats( legMeshes[ LEG_SPLAY   ] );

	this.surveyTree = this.surveyTree.findById( id );
	this.surveyTree.parent = null;

	this.loadStations( this.surveyTree );

	// ordering is important here

	this.clearSectionSelection();

	this.limits = this.getBounds();

	this.setFeatureBox();

	this.cutInProgress = true;

	return;

	function _cutObject ( obj ) {

		switch ( obj.type ) {

		case 'CV.Marker':

			// FIXME cutting needs fixing with new entrance code.
			if ( selectedSectionIds.has( obj.userData ) ) {

				self.pointTargets.push( obj );

			} else {

				cutList.push( obj );

			}

			break;

		case 'LineSegments':

			_cutLineGeometry( obj );

			break;

		case 'Mesh':

			if ( obj.cutRuns !== undefined && ! obj.cutRuns( self.selectedSectionIds ) ) {

				// remove this from survey layer mask
				self.layers.mask &= ~ obj.layers.mask; 

				cutList.push( obj );

			}

			break;

		case 'Box3Helper':
		case 'CV.Stations':

			cutList.push( obj );

			break;

		case 'Group':

			break;

		default:

//			console.log('unexpected object type in survey cut', obj.type );

		}

	}

	function _cutLineGeometry ( mesh ) {

		var vertexRuns = mesh.userData.legRuns;

		if ( ! vertexRuns ) return;

		var geometry = mesh.geometry;

		var vertices = geometry.vertices;
		var colors   = geometry.colors;

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

			cutList.push( mesh );

			return;

		}

		newGeometry.computeBoundingBox();

		mesh.geometry = newGeometry;
		mesh.userData.legRuns = newVertexRuns;

		geometry.dispose();

	}

};

Survey.prototype.getBounds = function () {

	var box = new Box3();

	var min = box.min;
	var max = box.max;

	this.traverse( _addObjectBounds );

	return box;

	function _addObjectBounds ( obj ) {

		if ( obj.type === 'CV.Survey' ) return; // skip survey which is positioned/scaled into world space

		var geometry = obj.geometry;

		if ( geometry && geometry.boundingBox ) {

			min.min( geometry.boundingBox.min );
			max.max( geometry.boundingBox.max );

		}

	}

};

Survey.prototype.setShadingMode = function ( mode ) {

	var material;

	switch ( mode ) {

	case SHADING_HEIGHT:

		material = Materials.getHeightMaterial( MATERIAL_SURFACE, this.limits );

		break;

	case SHADING_CURSOR:

		material = Materials.getCursorMaterial( MATERIAL_SURFACE, this.limits );

		break;

	case SHADING_SINGLE:

		material = new MeshLambertMaterial( { color: 0xffff000, vertexColors: NoColors } );

		break;

	case SHADING_SURVEY:

		// FIXME make multiple material for survey - > color and pass to Walls().

		break;

	case SHADING_DEPTH:

		material = Materials.getDepthMaterial( MATERIAL_SURFACE, this.limits );

		if ( ! material ) return false;

		break;

	case SHADING_DEPTH_CURSOR:

		material = Materials.getDepthCursorMaterial( MATERIAL_SURFACE, this.limits );

		if ( ! material ) return false;

		break;

	}

	if ( this.setLegShading( LEG_CAVE, mode ) ) {

		this.setWallShading( this.legMeshes[ FACE_WALLS  ], mode, material );
		this.setWallShading( this.legMeshes[ FACE_SCRAPS ], mode, material );

		return true;

	}

	return false;

};

Survey.prototype.setWallShading = function ( mesh, node, selectedMaterial ) {

	if ( ! mesh ) return;

	if ( selectedMaterial ) {

		mesh.setShading( this.selectedSectionIds, selectedMaterial );
		mesh.visible = true;

	} else {

		mesh.visible = false;

	}

	// FIXME - ressurect SHADING_SURVEY ???

};

Survey.prototype.hasFeature = function ( layerTag ) {

	return ! ( ( this.layers.mask & 1 << layerTag ) === 0 );

};

Survey.prototype.setLegShading = function ( legType, legShadingMode ) {

	var mesh = this.legMeshes[ legType ];

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

	case SHADING_DEPTH_CURSOR:

		this.setLegColourByDepthCursor( mesh );

		break;

	case SHADING_SINGLE:

		this.setLegColourByColour( mesh, ColourCache.yellow );

		break;

	case SHADING_SURVEY:

		this.setLegColourBySurvey( mesh );

		break;

	case SHADING_PATH:

		this.setLegColourByPath( mesh );

		break;

	case SHADING_OVERLAY:

		break;

	case SHADING_SHADED:

		break;

	case SHADING_DEPTH:

		this.setLegColourByDepth( mesh );

		break;

	default:

		console.log( 'invalid leg shading mode' );

		return false;

	}

	return true;

};

Survey.prototype.setLegColourByMaterial = function ( mesh, material ) {

	mesh.material = material;
	mesh.material.needsUpdate = true;

	this.setLegSelected( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2 ) {

		geometry.colors[ v1 ] = ColourCache.white;
		geometry.colors[ v2 ] = ColourCache.white;

	}

};

Survey.prototype.setLegColourByDepth = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getDepthMaterial( MATERIAL_LINE, this.limits ) );

};

Survey.prototype.setLegColourByDepthCursor = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getDepthCursorMaterial( MATERIAL_LINE, this.limits ) );

};

Survey.prototype.setLegColourByHeight = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getHeightMaterial( MATERIAL_LINE, this.limits ) );

};

Survey.prototype.setLegColourByCursor = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getCursorMaterial( MATERIAL_LINE, this.limits ) );

};

Survey.prototype.setLegColourByColour = function ( mesh, colour ) {

	mesh.material = Materials.getLineMaterial();

	this.setLegSelected( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2 ) {

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

};

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

};

Survey.prototype.setLegColourBySurvey = function ( mesh ) {

	var surveyToColourMap = SurveyColours.getSurveyColourMap( this.surveyTree, this.selectedSection );

	if ( this.selectedSectionIds.size === 0 ) this.surveyTree.getSubtreeIds( this.selectedSection, this.selectedSectionIds );

	mesh.material = Materials.getLineMaterial();

	this.setLegSelected ( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2, survey ) {

		var colour = surveyToColourMap[ survey ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

};

Survey.prototype.setLegColourByPath = function ( mesh ) {

	mesh.material = Materials.getLineMaterial();

	var routes = this.getRoutes();

	var c1 = ColourCache.yellow;
	var c2 = ColourCache.red;
	var c3 = ColourCache.white;

	var colour;

	this.setLegSelected ( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2 /*, survey */ ) {

		if ( routes.inCurrentRoute( v1 ) ) {

			colour = c1;

		} else if ( routes.adjacentToRoute( v1 ) ) {

			colour = c2;

		} else {

			colour = c3;
		}

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

};

Survey.prototype.setLegColourByInclination = function ( mesh, pNormal ) {

	var colours = ColourCache.inclination;
	var colourRange = colours.length - 1;
	var legNormal = new Vector3();

	// pNormal = normal of reference plane in model space 

	mesh.material = Materials.getLineMaterial();

	this.setLegSelected ( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2 ) {

		var vertex1 = geometry.vertices[ v1 ];
		var vertex2 = geometry.vertices[ v2 ];

		legNormal.subVectors( vertex1, vertex2 ).normalize();
		var dotProduct = legNormal.dot( pNormal );

		var hueIndex = Math.floor( colourRange * 2 * Math.acos( Math.abs( dotProduct ) ) / Math.PI );
		var colour = colours[ hueIndex ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

};

Survey.prototype.setLegSelected = function ( mesh, colourSegment ) {

	// pNormal = normal of reference plane in model space 
	var geometry   = mesh.geometry;
	var vertexRuns = mesh.userData.legRuns;

	var colors   = geometry.colors;

	var k, l, run, v;

	var selectedSectionIds = this.selectedSectionIds;

	if ( selectedSectionIds.size && vertexRuns ) {

		for ( run = 0, l = vertexRuns.length; run < l; run++ ) {

			var vertexRun = vertexRuns[ run ];
			var survey    = vertexRun.survey;
			var start     = vertexRun.start;
			var end       = vertexRun.end;
 
			if ( selectedSectionIds.has( survey ) ) {

				for ( v = start; v < end; v++ ) {

					k = v * 2;

					colourSegment( geometry, k, k + 1, survey );

				}

			} else {

				for ( v = start; v < end; v++ ) {

					k = v * 2;

					colors[ k ]     = ColourCache.grey;
					colors[ k + 1 ] = ColourCache.grey;

				}

			}

		}

	} else {

		for ( v = 0, l = geometry.vertices.length / 2; v < l; v++ ) {

			k = v * 2;

			colourSegment( geometry, k, k + 1 );

		}

	}

	geometry.colorsNeedUpdate = true;

};

export { Survey };

// EOF