
import {
	FACE_SCRAPS, FACE_WALLS,
	FEATURE_ENTRANCES, FEATURE_SELECTED_BOX, FEATURE_BOX, FEATURE_TRACES, FEATURE_STATIONS,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE, LABEL_STATION, STATION_ENTRANCE,
	MATERIAL_LINE, MATERIAL_SURFACE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_OVERLAY,
	SHADING_SURVEY, SHADING_SINGLE, SHADING_SHADED, SHADING_PATH, SHADING_DEPTH_CURSOR, SHADING_DISTANCE,
	upAxis
} from '../core/constants';

import { Cfg } from '../core/lib';
import { StationPosition } from '../core/StationPosition';
import { ColourCache } from '../core/ColourCache';
import { Box3Helper } from '../core/Box3';
import { Materials } from '../materials/Materials';
import { ClusterMarkers } from './ClusterMarkers';
import { Stations } from './Stations';
import { StationLabels } from './StationLabels';
import { Routes } from './Routes';
import { Legs } from './Legs';
import { DyeTraces } from './DyeTraces';
import { SurveyMetadata } from './SurveyMetadata';
import { SurveyColours } from '../core/SurveyColours';
import { LoxTerrain } from '../terrain/LoxTerrain';
import { buildWallsSync } from './walls/WallBuilders';

import { Matrix4, Vector3, Box3, Object3D, Color } from '../Three';
import { StencilLib } from '../core/StencilLib';
import proj4 from 'proj4';

function Survey ( cave ) {

	Object3D.call( this );

	this.selectedSectionIds = new Set();
	this.selectedSection = 0;
	this.selectedBox = null;
	this.highlightBox = null;
	this.featureBox = null;
	this.surveyTree = null;
	this.projection = null;
	this.wireframe = null;
	this.worldBoundingBox = null;

	// objects targetted by raycasters and objects with variable LOD

	this.pointTargets = [];
	this.legTargets = [];

	this.type = 'CV.Survey';
	this.cutInProgress = false;
	this.terrain = null;
	this.features = [];
	this.routes = null;
	this.stations = null;
	this.inverseWorld = null;
	this.colourAxis = [
		new Vector3( 1, 0, 0),
		new Vector3( 0, 1, 0),
		new Vector3( 0, 1, 1)
	];

	this.lightDirection = new Vector3( -1, -1, 2 ).normalize();

	const self = this;

	SurveyColours.clearMap(); // clear cache of survey section to colour

	const survey = cave.getSurvey();

	this.name = survey.title;
	this.CRS = survey.sourceCRS;
	this.displayCRS = survey.displayCRS;

	this.limits = survey.limits;
	this.offsets = survey.offsets;

	const modelLimits = new Box3().copy( this.limits );

	modelLimits.min.sub( this.offsets );
	modelLimits.max.sub( this.offsets );

	this.modelLimits = modelLimits;

	// this needs to be defined before loading the leg data to
	// allow correct leg lengths to be calculated

	_setProjectionScale();

	this.loadCave( survey );

	this.legTargets = [ this.features[ LEG_CAVE ] ];

	this.loadEntrances();

	this.setFeatureBox();

	this.addEventListener( 'removed', this.onRemoved );

	return;

	function _setProjectionScale () {

		// calculate scaling distortion if we have required CRS definitions
		const displayCRS = survey.displayCRS;

		if ( survey.sourceCRS === null || displayCRS === null || displayCRS === 'ORIGINAL' ) {

			self.scaleFactor = 1;

			return;

		}

		const limits = self.limits;

		const p1 = limits.min.clone();
		const p2 = limits.max.clone();

		p1.z = 0;
		p2.z = 0;

		const l1 = p1.distanceTo( p2 );

		const transform = proj4( displayCRS, survey.sourceCRS );

		p1.copy( transform.forward( p1 ) );
		p2.copy( transform.forward( p2 ) );

		self.projection = transform;

		const l2 = p1.distanceTo( p2 );

		self.scaleFactor = l1 / l2;
		StationPosition.scaleFactor = 1 / self.scaleFactor;

	}

}

Survey.prototype = Object.create( Object3D.prototype );

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

	const surveyTree = this.surveyTree;
	const entrances = this.metadata.entrances;
	const clusterMarkers = new ClusterMarkers( this.modelLimits, 4 );

	// remove common elements from station names if no alternatives available

	var endNode = surveyTree;

	while ( endNode.children.length === 1 ) endNode = endNode.children [ 0 ];

	// find entrances and add Markers

	surveyTree.traverse( _addEntrance );

	this.addFeature( clusterMarkers, FEATURE_ENTRANCES, 'CV.Survey:entrances' );

	return;

	function _addEntrance( node ) {

		if ( node.type !== STATION_ENTRANCE ) return;

		const entranceInfo = entrances[ node.getPath() ];

		// if ( entranceInfo === undefined || entranceInfo.name == undefined ) console.log( node.getPath( endNode ) );

		const name = ( entranceInfo !== undefined && entranceInfo.name !== undefined ) ? entranceInfo.name : node.getPath( endNode );

		if ( name === '-skip' ) return;

		clusterMarkers.addMarker( node, ' ' + name + ' ' );

	}

};

Survey.prototype.calibrateTerrain = function ( terrain ) {

	var s1 = 0, s2 = 0, n = 0;

	if ( terrain.isFlat ) return;

	// find height difference between all entrance locations and terrain
	// find average differences and use to alter height of terrain

	this.surveyTree.traverse( _testHeight );

	if ( n > 0 ) {

		// standard deviation

		let sd = Math.sqrt( s2 / n - Math.pow( s1 / n, 2 ) );

		// simple average

		terrain.datumShift = s1 / n;

		console.log( 'Adjustmenting terrain height by ', terrain.datumShift, sd );

	}

	if ( this.terrain === null ) this.terrain = terrain;

	// if we have a terrain we can make sure cluster markers can adjust to avoid terrain

	const markers = this.getFeature( FEATURE_ENTRANCES );

	if ( markers !== undefined ) {

		markers.addHeightProvider( terrain.getHeight.bind ( terrain ) );

	}

	return;

	function _testHeight( node ) {

		// FIXME to extend to surface points
		if ( node.type !== STATION_ENTRANCE) return;

		const v = node.p.z - terrain.getHeight( node.p );

		s1 += v;
		s2 += v * v;
		n++;

	}

};

Survey.prototype.loadCave = function ( cave ) {

	const self = this;

	this.surveyTree = cave.surveyTree;

	_loadSegments( cave.lineSegments );

	this.loadStations( cave.surveyTree );

	_loadTerrain( cave );

	this.computeBoundingBoxes( cave.surveyTree );

	this.pointTargets.push( this.stations );

	const metadata = new SurveyMetadata( this.name, cave.metadata );

	this.metadata = metadata;

	this.loadDyeTraces();

	this.routes = new Routes( metadata ).mapSurvey( this.stations, this.getFeature( LEG_CAVE ), this.surveyTree );

	buildWallsSync( cave, this );

	return;

	function _loadSegments ( srcSegments ) {

		const l = srcSegments.length;
		const typeLegs = [];

		typeLegs[ LEG_CAVE    ] = { vertices: [], colors: [], runs: [] };
		typeLegs[ LEG_SURFACE ] = { vertices: [], colors: [], runs: [] };
		typeLegs[ LEG_SPLAY   ] = { vertices: [], colors: [], runs: [] };

		var legs, run, i;
		var currentType;
		var currentSurvey;

		if ( l === 0 ) return null;

		for ( i = 0; i < l; i++ ) {

			const leg = srcSegments[ i ];

			const type   = leg.type;
			const survey = leg.survey;

			legs = typeLegs[ type ];

			if ( leg === undefined ) {

				console.warn( 'unknown segment type: ', type );
				break;

			}

			if ( survey !== currentSurvey || type !== currentType ) {

				// complete last run data

				if ( run !== undefined ) {

					const lastLegs = typeLegs[ currentType ];

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

			legs.vertices.push( leg.from );
			legs.vertices.push( leg.to );

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

			const legs = typeLegs[ tag ];

			if ( legs.vertices.length === 0 ) return;

			const legObject = self.getFeature( tag, Legs );

			legObject.addLegs( legs.vertices, legs.colors, legs.runs );

			self.addFeature( legObject, tag, name + ':g' );

		}

	}

	function _loadTerrain ( cave ) {

		if ( cave.hasTerrain === false ) return;

		const terrain = new LoxTerrain( cave.terrain, self.offsets );

		// get limits of terrain - ignoring maximum which distorts height shading etc
		const terrainLimits = new Box3().copy( terrain.tile.geometry.boundingBox );

		const modelLimits = self.modelLimits;

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

		o = new obj ();
		o.layers.set( tag );

	}

	return o;

};

Survey.prototype.update = function ( camera, target ) {

	const cameraLayers = camera.layers;

	if ( this.features[ FEATURE_ENTRANCES ] && cameraLayers.mask & 1 << FEATURE_ENTRANCES ) {

		this.getFeature( FEATURE_ENTRANCES ).cluster( camera, target, this.selectedSectionIds );

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
	obj.layers.set( tag );

	this.features[ tag ] = obj;

	this.addStatic( obj );

};

Survey.prototype.removeFeature = function ( obj ) {

	this.layers.mask &= ~ obj.layers.mask;

	const features = this.features;

	for ( var i = 0, l = features.length; i < l; i++ ) {

		if ( features[ i ] === obj ) delete features[ i ];

	}

};

Survey.prototype.hasFeature = function ( tag ) {

	return ! ( this.features[ tag ] === undefined );

};

Survey.prototype.loadStations = function ( surveyTree ) {

	const stations = new Stations();

	surveyTree.traverse( _addStation );

	// we have finished adding stations.
	stations.finalise();

	const stationLabels = new StationLabels( stations );

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

		const parent = node.parent;

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

	const traces = this.metadata.getTraces();

	if ( traces.length === 0 ) return;

	const surveyTree = this.surveyTree;
	const dyeTraces = new DyeTraces();

	var i, l;

	for ( i = 0, l = traces.length; i < l; i++ ) {

		const trace = traces[ i ];

		const startStation = surveyTree.getByPath( trace.start );
		const endStation   = surveyTree.getByPath( trace.end );

		if ( endStation === undefined || startStation === undefined ) continue;

		dyeTraces.addTrace( startStation.p, endStation.p );

	}

	dyeTraces.finish();

	this.addFeature( dyeTraces, FEATURE_TRACES, 'CV.DyeTraces' );

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

Survey.prototype.getWorldPosition = function ( position ) {

	return new Vector3().copy( position ).applyMatrix4( this.matrixWorld );

};

Survey.prototype.getGeographicalPosition = function ( position ) {

	const offsets = this.offsets;
	const projection = this.projection;

	var originalPosition = { x: position.x + offsets.x, y: position.y + offsets.y, z: 0 };

	// convert to original survey CRS

	if ( projection !== null ) originalPosition = projection.forward( originalPosition );

	originalPosition.z = position.z + offsets.z;

	return originalPosition;

};

Survey.prototype.shortestPathSearch = function ( station ) {

	this.routes.shortestPathSearch( station );
	this.setShadingMode( SHADING_DISTANCE );
	this.stations.highlightStation( station );

};

Survey.prototype.getMaxDistance = function () {

	return this.routes.maxDistance;

};

Survey.prototype.selectStation = function ( station ) {

	this.stations.selectStation( station );

};

Survey.prototype.clearSelection = function () {

	this.selectedSection = 0;
	this.selectedSectionIds.clear();

	this.stations.clearSelected();

	const box = this.selectedBox;

	if ( box !== null ) box.visible = false;

};

Survey.prototype.boxSection = function ( node, box, colour ) {

	if ( box === null ) {

		box = new Box3Helper( node.boundingBox, colour );

		box.onBeforeRender = StencilLib.featureOnBeforeRender;
		box.onAfterRender = StencilLib.featureOnAfterRender;

		box.layers.set( FEATURE_SELECTED_BOX );

		this.addStatic( box );
		box.updateMatrixWorld( true );

	} else {

		box.visible = true;
		box.update( node.boundingBox );

	}

	return box;

};

Survey.prototype.highlightSelection = function ( id ) {

	const surveyTree = this.surveyTree;
	const box = this.highlightBox;

	if ( id ) {

		const node = surveyTree.findById( id );

		if ( node.p === undefined && node.boundingBox !== undefined ) {

			this.highlightBox = this.boxSection( node, box, Cfg.themeValue( 'box.highlight' ) );

		} else if ( node.p ) {

			this.stations.highlightStation( node );

		}

	} else {

		if ( box !== null ) box.visible = false;

		this.stations.clearHighlight();

	}

};

Survey.prototype.selectSection = function ( id ) {

	const selectedSectionIds = this.selectedSectionIds;
	const surveyTree = this.surveyTree;

	var node;

	this.clearSelection();

	if ( id ) {

		node = surveyTree.findById( id );

		if ( node.p === undefined && node.boundingBox !== undefined ) {

			this.selectedBox = this.boxSection( node, this.selectedBox, Cfg.themeValue( 'box.select' ) );
			surveyTree.getSubtreeIds( id, selectedSectionIds );

			this.stations.selectStations( selectedSectionIds );

		} else {

			if ( node.p !== undefined ) this.stations.selectStation( node );

		}

	} else {

		this.stations.selectStations( this.selectedSectionIds );

	}

	this.selectedSection = id;

	return node;

};

Survey.prototype.setFeatureBox = function () {

	if ( this.featureBox === null ) {

		const box = new Box3Helper( this.modelLimits, Cfg.themeValue( 'box.bounding' ) );

		box.layers.set( FEATURE_BOX );
		box.name = 'survey-boundingbox';

		this.featureBox = box;
		this.addStatic( box );

	} else {

		this.featureBox.update( this.modelLimits );

	}

};

Survey.prototype.getWorldBoundingBox = function () {

	if ( this.worldBoundingBox === null ) {

		const geometry = this.featureBox.geometry;

		geometry.computeBoundingBox();

		this.worldBoundingBox = geometry.boundingBox.clone().applyMatrix4( this.matrixWorld );

	}

	return this.worldBoundingBox;

};

Survey.prototype.cutSection = function ( id ) {

	const selectedSectionIds = this.selectedSectionIds;
	const self = this;

	if ( selectedSectionIds.size === 0 ) return;

	// clear target lists

	this.pointTargets = [];
	this.legTargets   = [];

	this.terrain = null;

	// iterate through objects replace geometries and remove bounding boxes;

	const cutList = []; // list of Object3D's to remove from survey - workaround for lack of traverseReverse

	this.traverse( _cutObject );

	var i, l;

	for ( i = 0, l = cutList.length; i < l; i++ ) {

		const obj = cutList[ i ];
		const parent = obj.parent;

		if ( parent ) parent.remove( obj );

		// dispose of all geometry of this object and descendants

		if ( obj.geometry ) obj.geometry.dispose();

		this.removeFeature( obj );

	}

	this.surveyTree = this.surveyTree.findById( id );

	this.loadStations( this.surveyTree );

	this.pointTargets.push( this.stations );

	// ordering is important here

	this.clearSelection();
	this.highlightSelection( 0 );

	this.modelLimits = this.getBounds();
	this.limits.copy( this.modelLimits );

	this.limits.min.add( this.offsets );
	this.limits.max.add( this.offsets );

	this.setFeatureBox();

	this.worldBoundingBox = null;

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

	const box = new Box3();

	const min = box.min;
	const max = box.max;

	this.traverse( _addObjectBounds );

	return box;

	function _addObjectBounds ( obj ) {

		if ( obj.type === 'CV.Survey' || obj.type === 'CV.Box3' ) return;
		// skip survey which is positioned/scaled into world space

		const geometry = obj.geometry;

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

		material = Materials.getHeightMaterial( MATERIAL_SURFACE );

		break;

	case SHADING_CURSOR:

		material = Materials.getCursorMaterial( MATERIAL_SURFACE );

		break;

	case SHADING_SINGLE:

		material = Materials.getSurfaceMaterial( Cfg.themeValue( 'shading.single' ) );

		break;

	case SHADING_DEPTH:

		if ( this.terrain === null ) return false;

		material = Materials.getDepthMaterial( MATERIAL_SURFACE );

		if ( ! material ) return false;

		break;

	case SHADING_DEPTH_CURSOR:

		material = Materials.getDepthCursorMaterial( MATERIAL_SURFACE );

		if ( ! material ) return false;

		break;

	case SHADING_DISTANCE:
	case SHADING_SURVEY:

		material = false;

		break;

	}

	if ( mode !== SHADING_DISTANCE ) this.stations.clearHighlight();

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

	} else {

		mesh.visible = false;

	}

};

Survey.prototype.setLegShading = function ( legType, legShadingMode ) {

	const mesh = this.features[ legType ];

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

		this.setLegColourByColour( mesh, Cfg.themeColor( 'shading.single' ) );

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

	case SHADING_DISTANCE:

		if ( this.routes.maxDistance === 0 ) {

			this.setLegColourByColour( mesh, Cfg.themeColor( 'shading.unconnected' ) );

		} else {

			this.setLegColourByDistance( mesh );

		}

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

	this.setLegColourByMaterial( mesh, Materials.getDepthMaterial( MATERIAL_LINE ) );

};

Survey.prototype.setLegColourByDepthCursor = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getDepthCursorMaterial( MATERIAL_LINE ) );

};

Survey.prototype.setLegColourByHeight = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getHeightMaterial( MATERIAL_LINE ) );

};

Survey.prototype.setLegColourByCursor = function ( mesh ) {

	this.setLegColourByMaterial( mesh, Materials.getCursorMaterial( MATERIAL_LINE ) );

};

Survey.prototype.setLegColourByColour = function ( mesh, colour ) {

	mesh.setShading( this.selectedSectionIds, _colourSegment, Materials.getLineMaterial() );

	function _colourSegment ( geometry, v1, v2 ) {

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

};

Survey.prototype.setLegColourByAxis = function ( mesh ) {

	const vector = new Vector3();

	const c1 = this.colourAxis[ 0 ];
	const c2 = this.colourAxis[ 1 ];
	const c3 = this.colourAxis[ 2 ];

	mesh.setShading( this.selectedSectionIds, _colourSegment, Materials.getLineMaterial() );

	function _colourSegment ( geometry, v1, v2 ) {

		vector.copy( geometry.vertices[ v1 ] ).sub( geometry.vertices[ v2 ] ).normalize();

		const colour = new Color(
			Math.abs( vector.dot( c1 ) ),
			Math.abs( vector.dot( c2 ) ),
			Math.abs( vector.dot( c3 ) )
		);

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

};

Survey.prototype.setLegColourByLength = function ( mesh ) {

	const colours = ColourCache.getColors( 'gradient' );
	const colourRange = colours.length - 1;
	const stats = mesh.stats;
	const legLengths = mesh.legLengths;

	mesh.setShading( this.selectedSectionIds, _colourSegment, Materials.getLineMaterial() );

	function _colourSegment ( geometry, v1, v2 ) {

		const relLength = ( legLengths[ v1 / 2 ] - stats.minLegLength ) / stats.legLengthRange;
		const colour = colours[ Math.floor( relLength * colourRange ) ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

};

Survey.prototype.setLegColourByDistance = function ( mesh ) {

	const colours = ColourCache.getColors( 'gradient' );
	const unconnected = Cfg.themeColor( 'shading.unconnected' );

	const stations = this.stations;
	const colourRange = colours.length - 1;
	const maxDistance = this.routes.maxDistance;

	mesh.setShading( this.selectedSectionIds, _colourSegment, Materials.getLineMaterial() );

	function _colourSegment ( geometry, v1, v2 ) {

		geometry.colors[ v1 ] = _setDistanceColour( geometry, v1 );
		geometry.colors[ v2 ] = _setDistanceColour( geometry, v2 );

	}

	function _setDistanceColour( geometry, vertexIndex ) {

		const vertex = geometry.vertices[ vertexIndex ];
		const distance = stations.getStation( vertex ).distance;

		return ( distance === Infinity ) ? unconnected : colours[ Math.floor( colourRange * distance / maxDistance ) ];

	}

};

Survey.prototype.setLegColourBySurvey = function ( mesh ) {

	const surveyTree = this.surveyTree;

	var selectedSection = this.selectedSection;

	if ( selectedSection === 0) selectedSection = surveyTree.id;

	const surveyToColourMap = SurveyColours.getSurveyColourMap( surveyTree, selectedSection );

	if ( this.selectedSectionIds.size === 0 ) this.surveyTree.getSubtreeIds( selectedSection, this.selectedSectionIds );

	mesh.setShading( this.selectedSectionIds, _colourSegment, Materials.getLineMaterial() );

	function _colourSegment ( geometry, v1, v2, survey ) {

		const colour = surveyToColourMap[ survey ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

};

Survey.prototype.setLegColourByPath = function ( mesh ) {

	const routes = this.getRoutes();

	const c1 = Cfg.themeColor( 'routes.active' );
	const c2 = Cfg.themeColor( 'routes.adjacent' );
	const c3 = Cfg.themeColor( 'routes.default' );

	mesh.setShading( this.selectedSectionIds, _colourSegment, Materials.getLineMaterial() );

	function _colourSegment ( geometry, v1, v2 /*, survey */ ) {

		var colour;

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

	const colours = ColourCache.getColors( 'inclination' );

	const colourRange = colours.length - 1;
	const hueFactor = colourRange * 2 / Math.PI;
	const legNormal = new Vector3();

	// pNormal = normal of reference plane in model space

	mesh.setShading( this.selectedSectionIds, _colourSegment, Materials.getLineMaterial() );

	function _colourSegment ( geometry, v1, v2 ) {

		const vertex1 = geometry.vertices[ v1 ];
		const vertex2 = geometry.vertices[ v2 ];

		legNormal.subVectors( vertex1, vertex2 ).normalize();

		const dotProduct = legNormal.dot( pNormal );

		const hueIndex = Math.floor( hueFactor * Math.acos( Math.abs( dotProduct ) ) );
		const colour = colours[ hueIndex ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

};

export { Survey };

// EOF