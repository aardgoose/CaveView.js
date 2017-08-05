
import {
	FACE_SCRAPS, FACE_WALLS,
	FEATURE_ENTRANCES, FEATURE_SELECTED_BOX, FEATURE_BOX, FEATURE_TRACES, FEATURE_STATIONS,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE, LABEL_STATION, STATION_ENTRANCE,
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
import { StationLabels } from './StationLabels';
import { Routes } from './Routes';
import { Legs } from './Legs';
import { Point } from './Point';
import { Walls } from './Walls';
import { DyeTraces } from './DyeTraces';
import { SurveyMetadata } from './SurveyMetadata';
import { SurveyColours } from '../core/SurveyColours';
import { LoxTerrain } from '../terrain/LoxTerrain';
import { WorkerPool } from '../workers/WorkerPool';

import { Matrix4, Vector3, Box3, Object3D, TextureLoader, PointsMaterial } from '../../../../three.js/src/Three';

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
	this.terrain = null;
	this.isRegion = cave.isRegion;
	this.features = [];
	this.routes = null;
	this.stations = null;
	this.workerPool = new WorkerPool( 'caveWorker.js' );
	this.inverseWorld = null;

	// highlit point marker

	var pointerTexture = new TextureLoader().load( getEnvironmentValue( 'home', '' ) + 'images/ic_location.png' );
	var pointerMaterial = new PointsMaterial( { size: 32, map: pointerTexture, transparent : true, sizeAttenuation: false, alphaTest: 0.8 } );

	var point = new Point( pointerMaterial );

	point.visible = false;

	this.add( point );

	this.stationHighlight = point;

	var self = this;

	SurveyColours.clearMap(); // clear cache of survey section to colour

	var survey = cave.getSurvey();

	this.name = survey.title;
	this.CRS = ( survey.sourceCRS === null ) ? getEnvironmentValue( 'CRS', 'fred' ) : survey.sourceCRS;

	if ( this.isRegion === true ) {

		this.surveyTree = survey.surveyTree;
		this.limits = cave.getLimits();

	} else {

		var surveyLimits = survey.limits;

		this.limits = new Box3( new Vector3().copy( surveyLimits.min ), new Vector3().copy( surveyLimits.max ) );
		this.offsets = survey.offsets;

		var modelLimits = new Box3().copy( this.limits );

		modelLimits.min.sub( this.offsets );
		modelLimits.max.sub( this.offsets );

		this.modelLimits = modelLimits;

		this.loadCave( survey );

		this.legTargets = [ this.features[ LEG_CAVE ] ];

	}

	this.loadEntrances();

	this.setFeatureBox();

	_setProjectionScale();

	this.addEventListener( 'removed', this.onRemoved );

	return;

	function _setProjectionScale () {

		// calculate scaling distortion if we have required CRS definitions

		if ( survey.sourceCRS === null || survey.targetCRS === null ) {

			self.scaleFactor = 1;

			return;

		}

		var limits = self.limits;

		var p1 = limits.min.clone();
		var p2 = limits.max.clone();

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

}

Survey.prototype = Object.create( Object3D.prototype );

Survey.prototype.constructor = Survey;

Survey.prototype.onRemoved = function ( /* event */ ) {

	if ( this.cutInProgress ) {

		// avoid disposal phase when a cut operation is taking place.
		// this survey is being redisplayed.

		this.cutInProgress = false;

		return;

	}

	// needs explicit removal to call removed handlers atm
	this.remove( this.stations );

	this.traverse( _dispose );

	return;

	function _dispose ( object ) {

		if ( object.geometry ) object.geometry.dispose();

	}

};

Survey.prototype.loadEntrances = function () {

	var surveyTree = this.surveyTree;
	var self = this;

	var clusterMarkers = new ClusterMarkers( this.modelLimits, 4 );

	// remove common elements from station names

	var endNode = surveyTree;

	while ( endNode.children.length === 1 ) endNode = endNode.children [ 0 ];


	// find entrances and add Markers

	surveyTree.traverse( _addEntrance );

	this.addFeature( clusterMarkers, FEATURE_ENTRANCES, 'CV.Survey:entrances' );

	return;

	function _addEntrance( node ) {

		var marker;

		if ( node.type !== STATION_ENTRANCE ) return;

		marker = clusterMarkers.addMarker( node.p, node.getPath( endNode ) );

		self.pointTargets.push( marker );

	}

};

Survey.prototype.calibrateTerrain = function ( terrain ) {

	var s1 = 0, s2 = 0;
	var n = 0;

	// find height difference between all entrance locations and terrain
	// find average differences and use to alter height of terrain

	this.surveyTree.traverse( _testHeight );

	if ( n > 0 ) {

		// standard deviation

		var sd = Math.sqrt( s2 / n - Math.pow( s1 / n, 2 ) );

		// simple average

		terrain.datumShift = s1 / n;

		console.log( 'Adjustmenting terrain height by ', terrain.datumShift, sd );

	}

	if ( this.terrain === null ) this.terrain = terrain;

	return;

	function _testHeight( node ) {

		// FIXME to extend to surface points
		if ( node.type !== STATION_ENTRANCE) return;

		var v = node.p.z - terrain.getHeight( node.p );

		s1 += v;
		s2 += v * v;
		n++;

	}

};

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

	var metadata = new SurveyMetadata( this.name, cave.metadata );

	this.metadata = metadata;

	this.loadDyeTraces();

	this.routes = new Routes( metadata ).mapSurvey( this.stations, this.getLegs(), this.surveyTree );

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

	function _loadScraps ( scrapList ) {

		var l = scrapList.length;

		if ( l === 0 ) return null;

		var mesh = self.getFeature( FACE_SCRAPS, Walls );

		var indices = [];
		var vertices = [];

		var indexRuns = [];

		var vertexOffset = 0;
		var lastEnd = 0;

		for ( var i = 0; i < l; i++ ) {

			_loadScrap( scrapList[ i ] );

		}

		mesh.addWalls( vertices, indices, indexRuns );

		self.addFeature( mesh, FACE_SCRAPS, 'CV.Survey:faces:scraps' );

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

		var mesh = self.getFeature( FACE_WALLS, Walls );

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

		self.addFeature( mesh, FACE_WALLS, 'CV.Survey:faces:walls' );

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

		var typeLegs = [];

		typeLegs[ LEG_CAVE    ] = { vertices: [], colors: [], runs: [] };
		typeLegs[ LEG_SURFACE ] = { vertices: [], colors: [], runs: [] };
		typeLegs[ LEG_SPLAY   ] = { vertices: [], colors: [], runs: [] };

		var legs;

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

			legs = typeLegs[ type ];

			if ( leg === undefined ) {

				console.warn( 'unknown segment type: ', type );
				break;

			}

			if ( survey !== currentSurvey || type !== currentType ) {

				// complete last run data

				if ( run !== undefined ) {

					var lastLegs = typeLegs[ currentType ];

					run.end = lastLegs.vertices.length;
					lastLegs.runs.push( run );

				}

				// start new run

				run = {};

				run.survey = survey;
				run.start  = legs.vertices.length;

				currentSurvey = survey;
				currentType   = type;

			}


			legs.vertices.push( vertex1 );
			legs.vertices.push( vertex2 );

			legs.colors.push( ColourCache.white );
			legs.colors.push( ColourCache.white );

		}

		// add vertices run for last survey section encountered

		if ( run.end === undefined ) {

			run.end = legs.vertices.length;
			legs.runs.push( run );

		}

		_addModelSegments( LEG_CAVE, 'CV.Survey:cave:cave' );
		_addModelSegments( LEG_SURFACE, 'CV.Survey:surface:surface' );
		_addModelSegments( LEG_SPLAY, 'CV.Survey:cave:splay' );

		return;

		function _addModelSegments ( tag, name ) {

			var legs = typeLegs[ tag ];

			if ( legs.vertices.length === 0 ) return;

			var legObject = self.getFeature( tag, Legs );

			legObject.addLegs( legs.vertices, legs.colors, legs.runs );

			self.addFeature( legObject, tag, name + ':g' );

		}

	}

	function _loadTerrain ( cave ) {

		if ( cave.hasTerrain === false ) return;

		var terrain = new LoxTerrain( cave.terrain, self.offsets );

		// get limits of terrain - ignoring maximum which distorts height shading etc
		var terrainLimits = new Box3().copy( terrain.tile.geometry.boundingBox );

		var modelLimits = self.modelLimits;

		terrainLimits.min.z = modelLimits.min.z;
		terrainLimits.max.z = modelLimits.max.z;

		modelLimits.union( terrainLimits );

		self.terrain = terrain;

		return;

	}

};

Survey.prototype.getFeature = function ( tag, obj ) {

	var o = this.features[ tag ];

	if ( o === undefined && obj ) {

		o = new obj ( tag );

	}

	return o;

};

Survey.prototype.update = function ( camera, target ) {

	var cameraLayers = camera.layers;

	if ( this.features[ FEATURE_ENTRANCES ] && cameraLayers.mask & 1 << FEATURE_ENTRANCES ) {

		this.getFeature( FEATURE_ENTRANCES ).cluster( camera );

	}

	if ( this.features[ LABEL_STATION ] && cameraLayers.mask & 1 << LABEL_STATION ) {

		if ( this.inverseWorld === null ) {

			this.inverseWorld = new Matrix4().getInverse( this.matrixWorld );

		}

		this.getFeature( LABEL_STATION ).update( camera, target, this.inverseWorld );

	}

};

Survey.prototype.addFeature = function ( obj, tag, name ) {

	obj.name = name;

	this.features[ tag ] = obj;

	this.add( obj );

};

Survey.prototype.removeFeature = function ( obj ) {

	this.layers.mask &= ~ obj.layers.mask;

	var features = this.features;

	for ( var i = 0, l = features.length; i < l; i++ ) {

		if ( features[ i ] === obj ) delete features[ i ];

	}

};

Survey.prototype.hasFeature = function ( tag ) {

	return ! ( this.features[ tag ] === undefined );

};

Survey.prototype.loadStations = function ( surveyTree ) {

	var i, l;

	var stations = new Stations();
	var stationLabels = new StationLabels();

	surveyTree.traverse( _addStation );

	var legs = this.getLegs();

	// count number of legs linked to each station

	for ( i = 0; i < legs.length; i++ ) {

		stations.updateStation( legs[ i ] );

	}

	// we have finished adding stations.
	stations.finalise();


	// add labels for stations

	for ( i = 0, l = stations.count; i < l; i++ ) {

		stationLabels.addStation( stations.getStationByIndex( i ) );

	}

	this.addFeature( stations, FEATURE_STATIONS, 'CV.Stations' );
	this.addFeature( stationLabels, LABEL_STATION, 'CV.StationLabels' );

	this.stations = stations;

	return;

	function _addStation ( node ) {

		if ( node.p === undefined ) return;

		stations.addStation( node );

	}

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

Survey.prototype.loadDyeTraces = function () {

	var traces = this.metadata.getTraces();

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

	this.addFeature( dyeTraces, FEATURE_TRACES, 'CV.DyeTraces' );

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

Survey.prototype.getMetadataURL = function () {

	return this.metadata.getURL();

};

Survey.prototype.getLegs = function () {

	return this.getFeature( LEG_CAVE ).geometry.vertices;

};

Survey.prototype.getRoutes = function () {

	return this.routes;

};

Survey.prototype.setScale = function ( scale ) {

	this.stations.setScale( scale );

};

Survey.prototype.getWorldPosition = function ( position ) {

	return new Vector3().copy( position ).applyMatrix4( this.matrixWorld );

};

Survey.prototype.getGeographicalPosition = function ( position ) {

	var offsets = this.offsets;
	var projection = this.projection;

	var originalPosition = { x: position.x + offsets.x, y: position.y + offsets.y, z: 0 };

	// convert to original survey CRS

	if  ( projection !== null ) originalPosition = projection.forward( originalPosition );

	originalPosition.z = position.z + offsets.z;

	return originalPosition;

};

Survey.prototype.selectStation = function ( index ) {

	var stations = this.stations;
	var station = stations.getStationByIndex( index );

	stations.selectStation( station );

	return station;

};

Survey.prototype.clearSelection = function () {

	this.selectedSection = 0;
	this.selectedSectionIds.clear();

	this.stations.clearSelected();

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

Survey.prototype.highlightSelection = function ( id ) {

	var surveyTree = this.surveyTree;
	var node;
	var box = this.highlightBox;

	if ( id ) {

		node = surveyTree.findById( id );

		if ( node.p === undefined && node.boundingBox !== undefined ) {

			this.highlightBox = this.boxSection( node, box, 0xffff00 );

		} else if ( node.p ) {

			var highlight = this.stationHighlight;

			highlight.position.copy( node.p );
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

	this.clearSelection();

	if ( id ) {

		node = surveyTree.findById( id );

		if ( node.p === undefined && node.boundingBox !== undefined ) {

			this.selectedBox = this.boxSection( node, this.selectedBox, 0x00ff00 );
			surveyTree.getSubtreeIds( id, selectedSectionIds );

		} else {

			if ( node.p !== undefined ) this.stations.selectStation( node );

		}

	}

	this.selectedSection = id;

	return node;

};

Survey.prototype.setFeatureBox = function () {

	if ( this.featureBox === null ) {

		var box = new Box3Helper( this.modelLimits, 0xffffff );

		box.layers.set( FEATURE_BOX );
		box.name = 'survey-boundingbox';

		this.featureBox = box;
		this.add( box );

	} else {

		this.featureBox.update( this.modelLimits );

	}

};

Survey.prototype.cutSection = function ( id ) {

	var selectedSectionIds = this.selectedSectionIds;
	var self = this;

	if ( selectedSectionIds.size === 0 ) return;

	// clear target lists

	this.PointTargets = [];
	this.legTargets   = [];

	this.terrain = null;

	// iterate through objects replace geometries and remove bounding boxes;

	var cutList = []; // list of Object3D's to remove from survey - workaround for lack of traverseReverse

	this.traverse( _cutObject );

	for ( var i = 0, l = cutList.length; i < l; i++ ) {

		var obj = cutList[ i ];
		var parent = obj.parent;

		if ( parent ) parent.remove( obj );

		// dispose of all geometry of this object and descendants

		if ( obj.geometry ) obj.geometry.dispose();

		this.removeFeature( obj );

	}

	this.surveyTree = this.surveyTree.findById( id );
	this.surveyTree.parent = null;

	this.loadStations( this.surveyTree );

	// ordering is important here

	this.clearSelection();
	this.highlightSelection( 0 );

	this.modelLimits = this.getBounds();
	this.limits.copy( this.modelLimits );

	this.limits.min.add( this.offsets );
	this.limits.max.add( this.offsets );

	this.setFeatureBox();

	this.loadEntrances();

	this.cutInProgress = true;

	return;

	function _cutObject ( obj ) {

		switch ( obj.type ) {

		case 'Legs':
		case 'Walls':

			if ( ! obj.cutRuns( self.selectedSectionIds ) ) cutList.push( obj );

			break;

		case 'Box3Helper':
		case 'CV.Stations':
		case 'CV.StationLabels':
		case 'CV.ClusterMarker':

			cutList.push( obj );

			break;

		case 'Group':

			break;

		}

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

		material = Materials.getHeightMaterial( MATERIAL_SURFACE, this.modelLimits );

		break;

	case SHADING_CURSOR:

		material = Materials.getCursorMaterial( MATERIAL_SURFACE, this.modelLimits );

		break;

	case SHADING_SINGLE:

		material = Materials.getSurfaceMaterial();

		break;

	case SHADING_SURVEY:

		// FIXME make multiple material for survey - > color and pass to Walls().

		break;

	case SHADING_DEPTH:

		material = Materials.getDepthMaterial( MATERIAL_SURFACE, this.modelLimits, this.terrain );

		if ( ! material ) return false;

		break;

	case SHADING_DEPTH_CURSOR:

		material = Materials.getDepthCursorMaterial( MATERIAL_SURFACE, this.modelLimits, this.terrain );

		if ( ! material ) return false;

		break;

	}

	if ( this.setLegShading( LEG_CAVE, mode ) ) {

		this.setWallShading( this.features[ FACE_WALLS  ], mode, material );
		this.setWallShading( this.features[ FACE_SCRAPS ], mode, material );

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

Survey.prototype.setLegShading = function ( legType, legShadingMode ) {

	var mesh = this.features[ legType ];

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

		this.setLegColourByColour( mesh, ColourCache.white );

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

		console.warn( 'invalid leg shading mode' );

		return false;

	}

	return true;

};

Survey.prototype.setLegColourByMaterial = function ( mesh, material ) {

	material.needsUpdate = true;

	mesh.setShading( this.selectedSectionIds, _colourSegment, material );

	function _colourSegment ( geometry, v1, v2 ) {

		geometry.colors[ v1 ] = ColourCache.white;
		geometry.colors[ v2 ] = ColourCache.white;

	}

};

Survey.prototype.setLegColourByDepth = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getDepthMaterial( MATERIAL_LINE, this.modelLimits, this.terrain ) );

};

Survey.prototype.setLegColourByDepthCursor = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getDepthCursorMaterial( MATERIAL_LINE, this.modelLimits, this.terrain ) );

};

Survey.prototype.setLegColourByHeight = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getHeightMaterial( MATERIAL_LINE, this.modelLimits ) );

};

Survey.prototype.setLegColourByCursor = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getCursorMaterial( MATERIAL_LINE, this.modelLimits ) );

};

Survey.prototype.setLegColourByColour = function ( mesh, colour ) {

	mesh.setShading( this.selectedSectionIds, _colourSegment, Materials.getLineMaterial() );

	function _colourSegment ( geometry, v1, v2 ) {

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

};

Survey.prototype.setLegColourByLength = function ( mesh ) {

	var colours = ColourCache.getColors( 'gradient' );
	var colourRange = colours.length - 1;
	var stats = mesh.stats;

	mesh.setShading( this.selectedSectionIds, _colourSegment, Materials.getLineMaterial() );

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

	var surveyTree = this.surveyTree;
	var selectedSection = this.selectedSection;

	if ( selectedSection === 0) selectedSection = surveyTree.id;

	var surveyToColourMap = SurveyColours.getSurveyColourMap( surveyTree, selectedSection );

	if ( this.selectedSectionIds.size === 0 ) this.surveyTree.getSubtreeIds( selectedSection, this.selectedSectionIds );

	mesh.setShading( this.selectedSectionIds, _colourSegment, Materials.getLineMaterial() );

	function _colourSegment ( geometry, v1, v2, survey ) {

		var colour = surveyToColourMap[ survey ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

};

Survey.prototype.setLegColourByPath = function ( mesh ) {

	var routes = this.getRoutes();

	var c1 = ColourCache.yellow;
	var c2 = ColourCache.red;
	var c3 = ColourCache.white;

	var colour;

	mesh.setShading( this.selectedSectionIds, _colourSegment, Materials.getLineMaterial() );

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

	var colours = ColourCache.getColors( 'inclination' );

	var colourRange = colours.length - 1;
	var hueFactor = colourRange * 2 / Math.PI;
	var legNormal = new Vector3();

	// pNormal = normal of reference plane in model space

	mesh.setShading( this.selectedSectionIds, _colourSegment, Materials.getLineMaterial() );

	function _colourSegment ( geometry, v1, v2 ) {

		var vertex1 = geometry.vertices[ v1 ];
		var vertex2 = geometry.vertices[ v2 ];

		legNormal.subVectors( vertex1, vertex2 ).normalize();
		var dotProduct = legNormal.dot( pNormal );

		var hueIndex = Math.floor( hueFactor * Math.acos( Math.abs( dotProduct ) ) );
		var colour = colours[ hueIndex ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

};

export { Survey };

// EOF