import {
	FACE_SCRAPS, FACE_WALLS,
	FEATURE_ENTRANCES, FEATURE_BOX, FEATURE_TRACES,
	FEATURE_STATIONS, SURVEY_WARNINGS, STATION_ENTRANCE,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE, LABEL_STATION, LABEL_STATION_COMMENT,
	MATERIAL_LINE, MATERIAL_SURFACE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_OVERLAY,
	SHADING_SURVEY, SHADING_SINGLE, SHADING_SHADED, SHADING_PATH, SHADING_DEPTH_CURSOR, SHADING_DISTANCE, CLUSTER_MARKERS,
} from '../core/constants';

import { StationPosition } from '../core/StationPosition';
import { Box3Helper } from '../core/Box3';
import { Entrances } from './Entrances';
import { Stations } from './Stations';
import { StationLabels } from './StationLabels';
import { StationMarkers } from './StationMarkers';
import { Topology } from './Topology';
import { Routes } from './Routes';
import { Legs } from './Legs';
import { DyeTraces } from './DyeTraces';
// import { Annotations } from './Annotations';
import { SurveyMetadata } from './SurveyMetadata';
import { LoxTerrain } from '../terrain/LoxTerrain';
import { buildWallsSync } from './walls/WallBuilders';
import { SurveyColourMapper} from '../core/SurveyColourMapper';
import { Selection } from './Selection';

import { Matrix4, Vector3, Box3, Object3D } from '../Three';
import proj4 from 'proj4';

const __set = new Set();

Selection.prototype = Object.create( Box3Helper.prototype );

function Survey ( ctx, cave ) {

	Object3D.call( this );

	this.highlightBox = null;
	this.highlightPath = null;
	this.lastMarkedStation = null;
	this.markers = new StationMarkers( ctx, 0x00ff00 );
	this.featureBox = null;
	this.surveyTree = null;
	this.projection = null;
	this.projectionWGS84 = null;
	this.worldBoundingBox = null;
	this.caveShading = SHADING_HEIGHT;
	this.surfaceShading = SHADING_SINGLE;
	this.ctx = ctx;

	// objects targeted by raycasters and objects with variable LOD

	this.pointTargets = [];
	this.legTargets = [];
	this.entranceTargets = [];

	this.type = 'CV.Survey';
	this.cutInProgress = false;
	this.features = new Map();
	this.routes = null;
	this.stations = null;
	this.terrain = null;
	this.topology = null;
	this.annotations = null;
	this.inverseWorld = new Matrix4();

	this.lightDirection = new Vector3( -1, -1, 2 ).normalize();

	const self = this;

	this.gradientName = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';

	ctx.surveyColourMapper = new SurveyColourMapper( ctx );

	var survey = cave.getSurvey();

	this.name = survey.title;
	this.CRS = survey.sourceCRS;
	this.displayCRS = survey.displayCRS;

	this.limits = survey.limits;
	this.offsets = survey.offsets;
	this.messages = cave.messages;

	const modelLimits = new Box3().copy( this.limits );

	modelLimits.min.sub( this.offsets );
	modelLimits.max.sub( this.offsets );

	this.modelLimits = modelLimits;
	this.combinedLimits = modelLimits;

	// this needs to be defined before loading the leg data to
	// allow correct leg lengths to be calculated

	_setProjectionScale();

	this.loadCave( survey );

	this.loadWarnings();

	this.legTargets = [ this.features.get( LEG_CAVE ) ];

	this.loadEntrances();

	this.setFeatureBox();

	this.addStatic( this.markers );

	this.addEventListener( 'removed', this.onRemoved );

	var zScale = 0.5;

	survey = null;

	Object.defineProperty( this, 'zScale', {
		get: function () { return zScale; },
		set: function ( scale ) {

			// scale - in range 0 - 1

			const lastScale = Math.pow( 2, ( zScale - 0.5 ) * 4 );
			const newScale  = Math.pow( 2, ( scale - 0.5 ) * 4 );

			self.applyMatrix4( new Matrix4().makeScale( 1, 1, newScale / lastScale ) );
			self.updateMatrix();

			zScale = scale;

		}
	} );

	return;

	function _setProjectionScale () {

		// calculate scaling distortion if we have required CRS definitions
		const displayCRS = survey.displayCRS;

		if ( survey.sourceCRS === null || displayCRS === null || displayCRS === 'ORIGINAL' ) {

			self.scaleFactor = 1;

			if ( survey.sourceCRS !== null ) {

				self.projectionWGS84 = proj4( 'WGS84', survey.sourceCRS );

			}

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

		self.projectionWGS84 = proj4( 'WGS84', survey.displayCRS );

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

	this.traverse( _dispose );

	while ( this.children.length > 0 ) { this.remove( this.children[ 0 ] ); }

	return;

	function _dispose ( object ) { if ( object.geometry ) object.geometry.dispose(); }

};

Survey.prototype.loadWarnings = function () {

	const surveyTree = this.surveyTree;
	const messages = this.messages;
	const selection = this.selection;

	if ( messages.length > 0 ) {

		const errorMarkers = new StationMarkers( this.ctx, 0xff00ff );

		messages.forEach( function ( message ) {

			const node = surveyTree.getByPath( message.station );

			if ( node !== undefined && selection.contains( node.id ) ) {

				errorMarkers.mark( node );
				node.messageText = message.text;

			}

		} );

		this.addFeature( errorMarkers, SURVEY_WARNINGS, 'CV.Survey:warnings' );

	}

};

Survey.prototype.loadEntrances = function () {

	const entrances = new Entrances( this.ctx, this );

	this.addFeature( entrances, FEATURE_ENTRANCES, 'CV.Survey:entrances' );

	this.entranceTargets = [ entrances.markers ];
	this.entrances = entrances;

};

Survey.prototype.setupTerrain = function ( terrain ) {

	if ( terrain.isFlat ) return;

	// find height difference between all entrance locations and terrain
	// find average differences and use to alter height of terrain

	const points = [];

	this.surveyTree.traverse( _getSurfacePoints );

	terrain.fitSurface( points, this.offsets );

	if ( this.terrain === null ) this.terrain = terrain;

	// if we have a terrain we can make sure cluster markers can adjust to avoid terrain

	const markers = this.getFeature( FEATURE_ENTRANCES );

	if ( markers !== undefined ) {

		markers.addHeightProvider( terrain.getHeight.bind( terrain ) );

	}

	return;

	function _getSurfacePoints( node ) {

		// FIXME to extend to surface points
		if ( node.type !== STATION_ENTRANCE) return;
		points.push( node.p );

	}

};

Survey.prototype.loadCave = function ( cave ) {

	const self = this;
	const ctx = this.ctx;

	const surveyTree = cave.surveyTree;

	this.surveyTree = surveyTree;

	this.selection = new Selection( this, this.ctx.cfg.themeValue( 'box.select' ) );

	_loadSegments( cave.lineSegments );

	this.loadStations( surveyTree );

	_loadTerrain( cave );

	this.computeBoundingBoxes( surveyTree );

	this.pointTargets.push( this.stations );

	const metadata = new SurveyMetadata( this.name, cave.metadata );

	this.metadata = metadata;

	this.loadDyeTraces();
	// this.loadAnnotations();

	this.topology = new Topology( this.stations, this.getFeature( LEG_CAVE ) );

	this.routes = new Routes( this );

	buildWallsSync( cave, this );

	return;

	function _loadSegments ( srcSegments ) {

		const l = srcSegments.length;
		const typeLegs = [];

		typeLegs[ LEG_CAVE    ] = { vertices: [], runs: [] };
		typeLegs[ LEG_SURFACE ] = { vertices: [], runs: [] };
		typeLegs[ LEG_SPLAY   ] = { vertices: [], runs: [] };

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

			// old code to allow combined surveys
			// const legObject = self.getFeature( tag, Legs );
			const legObject = new Legs( self.ctx );

			legObject.addLegs( legs.vertices, legs.runs );

			self.addFeature( legObject, tag, name + ':g' );

		}

	}

	function _loadTerrain ( cave ) {

		if ( cave.hasTerrain === false ) return;

		const terrain = new LoxTerrain( ctx, cave.terrains, self.offsets );

		// expand limits with terrain

		self.combinedLimits = new Box3().copy( terrain.getBoundingBox() ).union( self.modelLimits );

		self.terrain = terrain;

		return;

	}

};

Survey.prototype.getFeature = function ( tag, obj ) {

	var o = this.features.get( tag );

	if ( o === undefined && obj ) {

		o = new obj ();
		o.layers.set( tag );

	}

	return o;

};

Survey.prototype.update = function ( cameraManager, target, showClusterMarkers ) {

	const camera = cameraManager.activeCamera;

	const entrances = this.features.get( FEATURE_ENTRANCES );

	if ( entrances && cameraManager.testCameraLayer( FEATURE_ENTRANCES ) ) {

		cameraManager.setCameraLayer( CLUSTER_MARKERS, showClusterMarkers );
		entrances.cluster( camera, target, this.selection, showClusterMarkers );

	} else {

		cameraManager.setCameraLayer( CLUSTER_MARKERS, false );

	}

	const stationLabels = this.features.get( LABEL_STATION );

	if ( ( stationLabels && cameraManager.testCameraLayer( LABEL_STATION ) ) ||
		stationLabels.commentCount > 0 && cameraManager.testCameraLayer( LABEL_STATION_COMMENT ) ) {

		stationLabels.update( camera, target, this.inverseWorld );

	}

};

Survey.prototype.addFeature = function ( obj, tag, name ) {

	obj.name = name;
	obj.layers.set( tag );

	this.features.set( tag, obj );

	this.addStatic( obj );

	return obj;

};

Survey.prototype.removeFeature = function ( obj ) {

	this.layers.mask &= ~ obj.layers.mask;

	const features = this.features;

	features.forEach( function ( value, key ) {

		if ( value === obj ) features.delete( key );

	} );

};

Survey.prototype.hasFeature = function ( tag ) {

	return this.features.has( tag );

};

Survey.prototype.loadStations = function ( surveyTree ) {

	const stations = new Stations( this.ctx, this.selection );

	var commentCount = 0;

	surveyTree.traverse( _addStation );

	// we have finished adding stations.
	stations.finalise();

	const stationLabels = new StationLabels( this.ctx, stations, commentCount );

	this.addFeature( stations, FEATURE_STATIONS, 'CV.Stations' );
	this.addFeature( stationLabels, LABEL_STATION, 'CV.StationLabels' );

	if ( commentCount > 0 ) {

		this.features.set( LABEL_STATION_COMMENT, stationLabels );
		stationLabels.layers.enable( LABEL_STATION_COMMENT );

	}

	this.stations = stations;

	return;

	function _addStation ( node ) {

		if ( node.comment !== undefined ) commentCount++;
		if ( ! node.isStation() ) return;

		stations.addStation( node );

	}

};

Survey.prototype.computeBoundingBoxes = function ( surveyTree ) {

	surveyTree.traverseDepthFirst( _computeBoundingBox );

	return;

	function _computeBoundingBox ( node ) {

		const parent = node.parent;

		if ( parent && parent.boundingBox === undefined ) parent.boundingBox = new Box3();

		if ( node.isStation() ) {

			parent.boundingBox.expandByPoint( node.p );

		} else if ( parent ) {

			if ( node.children.length === 0 || ( node.boundingBox !== undefined && node.boundingBox.isEmpty() ) ) return;

			parent.boundingBox.expandByPoint( node.boundingBox.min );
			parent.boundingBox.expandByPoint( node.boundingBox.max );

		}

	}

};

Survey.prototype.loadDyeTraces = function () {

	const dyeTraces = new DyeTraces( this );

	this.addFeature( dyeTraces, FEATURE_TRACES, 'CV.DyeTraces' );

	this.dyeTraces = dyeTraces;

};
/*
Survey.prototype.loadAnnotations = function () {

	const annotations = new Annotations( this );

	this.addFeature( annotations, FEATURE_ANNOTATIONS, 'CV.DyeTraces' );

	this.annotations = annotations;

};
*/

Survey.prototype.setScale = function ( hScale, vScale ) {

	this.scale.set( hScale, hScale, vScale );

	this.position.copy( this.combinedLimits.getCenter( new Vector3() ).multiply( this.scale ).negate() );

	this.updateMatrix();
	this.updateMatrixWorld();
	this.inverseWorld.getInverse( this.matrixWorld );

};

Survey.prototype.getLegs = function () {

	return this.getFeature( LEG_CAVE ).geometry.vertices;

};

Survey.prototype.getRoutes = function () {

	return this.routes;

};

Survey.prototype.getWorldPosition = function ( position ) {

	return position.applyMatrix4( this.matrixWorld );

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

Survey.prototype.containsWGS84Position = function ( position ) {

	position.copy( this.projectionWGS84.forward( position ) );

	const min = this.limits.min;
	const max = this.limits.max;

	return ( position.x >= min.x && position.x <= max.x && position.y >= min.y && position.y <= max.y );

};

Survey.prototype.getModelSurfaceFromWGS84 = function ( position, callback ) {

	const self = this;

	position.copy( this.projectionWGS84.forward( position ) );

	this.terrain.getHeights( [ position ], _handleResult );

	return;

	function _handleResult ( points ) {

		position.z = points[ 0 ].z;
		position.sub( self.offsets );

		callback();

	}

};

Survey.prototype.shortestPathSearch = function ( station ) {

	this.highlightPath = null;

	this.markers.clear();

	this.topology.shortestPathSearch( station );

	this.markers.mark( station );

	this.setShadingMode( SHADING_DISTANCE );

};

Survey.prototype.showShortestPath = function ( station ) {

	this.highlightPath = this.topology.getShortestPath( station );

	if ( this.lastMarkedStation !== null ) this.markers.unmark( this.lastMarkedStation );

	this.markers.mark( station );

	this.lastMarkedStation = station;

	this.setLegShading( LEG_CAVE, SHADING_DISTANCE );

};

Survey.prototype.getMaxDistance = function () {

	return this.topology.maxDistance;

};

Survey.prototype.selectStation = function ( station ) {

	this.stations.selectStation( station );

};

Survey.prototype.highlightSelection = function ( node ) {

	if ( node.isStation() ) {

		this.stations.highlightStation( node );

	} else {

		let box = this.highlightBox;

		if ( box === null ) {

			box = new Selection( this,  this.ctx.cfg.themeValue( 'box.highlight' ) );
			this.highlightBox = box;

		}

		box.set( node );
		this.stations.clearHighlight();

		if ( node === this.surveyTree ) {

			this.entrances.setSelection( this.selection );

		} else {

			this.entrances.setSelection( box );

		}

	}

};

Survey.prototype.selectSection = function ( node ) {

	const selection = this.selection;

	this.highlightSelection( this.surveyTree );

	selection.set( node );

	this.stations.selectStations( selection );
	this.entrances.setSelection( selection );
	this.setShadingMode( this.caveShading );

	return node;

};

Survey.prototype.setFeatureBox = function () {

	if ( this.featureBox === null ) {

		const box = new Box3Helper( this.combinedLimits, this.ctx.cfg.themeValue( 'box.bounding' ) );

		box.layers.set( FEATURE_BOX );
		box.name = 'survey-boundingbox';

		this.featureBox = box;
		this.addStatic( box );

	} else {

		this.featureBox.update( this.combinedLimits );

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

Survey.prototype.cutSection = function ( node ) {

	const selection = this.selection;
	const self = this;

	selection.set( node );

	if ( selection.isEmpty() ) return;

	// clear target lists

	this.pointTargets = [];
	this.legTargets   = [];
	this.entranceTargets = [];

	this.terrain = null;

	// iterate through objects replace geometries and remove bounding boxes;

	const cutList = []; // list of Object3D's to remove from survey - workaround for lack of traverseReverse

	this.traverse( _cutObject );

	cutList.forEach( function ( obj ) {

		const parent = obj.parent;

		if ( parent ) parent.remove( obj );

		// dispose of all geometry of this object and descendants

		if ( obj.geometry ) obj.geometry.dispose();

		self.removeFeature( obj );

	} );

	this.surveyTree = node;
	this.selection.setRoot( node );

	if ( this.highlightBox ) this.highlightBox.setRoot( node );

	this.loadStations( node );

	this.pointTargets.push( this.stations );

	// ordering is important here

	this.selectSection( node );

	this.modelLimits = this.getBounds();
	this.combinedLimits = this.modelLimits;

	this.limits.copy( this.modelLimits );

	this.limits.min.add( this.offsets );
	this.limits.max.add( this.offsets );

	this.setFeatureBox();

	this.worldBoundingBox = null;

	this.loadEntrances();

	// this.loadWarnings();
	// this.loadDyeTraces();

	this.topology = new Topology( this.stations, this.getFeature( LEG_CAVE ) );

	this.cutInProgress = true;

	return;

	function _cutObject ( obj ) {

		switch ( obj.type ) {

		case 'Legs':
		case 'Walls':

			if ( ! obj.cutRuns( selection ) ) cutList.push( obj );

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

	const materials = this.ctx.materials;

	var material;

	switch ( mode ) {

	case SHADING_HEIGHT:

		material = materials.getHeightMaterial( MATERIAL_SURFACE );

		break;

	case SHADING_CURSOR:

		material = materials.getCursorMaterial( MATERIAL_SURFACE );

		break;

	case SHADING_SINGLE:

		material = materials.getSurfaceMaterial();

		break;

	case SHADING_DEPTH:

		if ( this.terrain === null ) return false;

		material = materials.getDepthMaterial( MATERIAL_SURFACE );

		if ( ! material ) return false;

		break;

	case SHADING_DEPTH_CURSOR:

		if ( this.terrain === null ) return false;

		material = materials.getDepthCursorMaterial( MATERIAL_SURFACE );

		if ( ! material ) return false;

		break;

	case SHADING_DISTANCE:
	case SHADING_SURVEY:

		material = false;

		break;

	}

	this.markers.setVisibility( ( mode === SHADING_DISTANCE ) );

	if ( this.setLegShading( LEG_CAVE, mode ) ) {

		this.setWallShading( this.features.get( FACE_WALLS  ), material );
		this.setWallShading( this.features.get( FACE_SCRAPS ), material );

		this.caveShading = mode;

	}

	return this.caveShading;

};

Survey.prototype.setWallShading = function ( mesh, selectedMaterial ) {

	if ( ! mesh ) return;

	if ( selectedMaterial ) {

		mesh.setShading( this.selection, selectedMaterial );

	} else {

		mesh.visible = false;

	}

};

Survey.prototype.setSurfaceShading = function ( mode ) {

	if ( this.setLegShading( LEG_SURFACE, mode ) ) {

		this.surfaceShading = mode;

	}

	return this.surfaceShading;

};

Survey.prototype.setLegShading = function ( legType, legShadingMode ) {

	const mesh = this.features.get( legType );

	if ( mesh === undefined ) return false;

	switch ( legShadingMode ) {

	case SHADING_HEIGHT:

		this.setLegColourByHeight( mesh );

		break;

	case SHADING_LENGTH:

		this.setLegColourByLength( mesh );

		break;

	case SHADING_INCLINATION:

		this.setLegColourByInclination( mesh, Object3D.DefaultUp );

		break;

	case SHADING_CURSOR:

		this.setLegColourByCursor( mesh );

		break;

	case SHADING_DEPTH_CURSOR:

		this.setLegColourByDepthCursor( mesh );

		break;

	case SHADING_SINGLE:

		this.setLegColourByColour( mesh, this.ctx.cfg.themeColor( 'shading.single' ) );

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

		if ( this.topology.maxDistance === 0 ) {

			this.setLegColourByColour( mesh, this.ctx.cfg.themeColor( 'shading.unconnected' ) );

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

	const colourCache = this.ctx.materials.colourCache;

	material.needsUpdate = true;

	mesh.setShading( this.selection.getIds(), _colourSegment, material );

	function _colourSegment ( vertices, colors, v1, v2 ) {

		colourCache.white.toArray( colors, v1 * 3 );
		colourCache.white.toArray( colors, v2 * 3 );

	}

};

Survey.prototype.setLegColourByDepth = function ( mesh ) {

	const materials = this.ctx.materials;

	this.setLegColourByMaterial( mesh, materials.getDepthMaterial( MATERIAL_LINE ) );

};

Survey.prototype.setLegColourByDepthCursor = function ( mesh ) {

	const materials = this.ctx.materials;

	this.setLegColourByMaterial( mesh, materials.getDepthCursorMaterial( MATERIAL_LINE ) );

};

Survey.prototype.setLegColourByHeight = function ( mesh ) {

	const materials = this.ctx.materials;

	this.setLegColourByMaterial( mesh, materials.getHeightMaterial( MATERIAL_LINE ) );

};

Survey.prototype.setLegColourByCursor = function ( mesh ) {

	const materials = this.ctx.materials;

	this.setLegColourByMaterial( mesh, materials.getCursorMaterial( MATERIAL_LINE ) );

};

Survey.prototype.setLegColourByColour = function ( mesh, colour ) {

	const materials = this.ctx.materials;

	mesh.setShading( this.selection.getIds(), _colourSegment, materials.getLineMaterial() );

	function _colourSegment ( vertices, colors, v1, v2 ) {

		colour.toArray( colors, v1 * 3 );
		colour.toArray( colors, v2 * 3 );

	}

};

Survey.prototype.setLegColourByLength = function ( mesh ) {

	const materials = this.ctx.materials;
	const colours = materials.colourCache.getColors( this.gradientName );
	const colourRange = colours.length - 1;
	const stats = mesh.stats;
	const legLengths = mesh.legLengths;

	mesh.setShading( this.selection.getIds(), _colourSegment, materials.getLineMaterial() );

	function _colourSegment ( vertices, colors, v1, v2 ) {

		const relLength = ( legLengths[ v1 / 2 ] - stats.minLegLength ) / stats.legLengthRange;
		const colour = colours[ Math.floor( relLength * colourRange ) ];

		colour.toArray( colors, v1 * 3 );
		colour.toArray( colors, v2 * 3 );

	}

};

Survey.prototype.setLegColourByDistance = function ( mesh ) {

	const cfg = this.ctx.cfg;
	const materials = this.ctx.materials;

	const colours = materials.colourCache.getColors( this.gradientName );
	const unconnected = cfg.themeColor( 'shading.unconnected' );
	const pathColor = cfg.themeColor( 'routes.active' );

	const stations = this.stations;
	const colourRange = colours.length - 1;
	const maxDistance = this.topology.maxDistance;
	const path = this.highlightPath;

	mesh.setShading( this.selection.getIds(), _colourSegment, materials.getLineMaterial() );

	function _colourSegment ( vertices, colors, v1, v2 ) {

		const onPath = ( path !== null && path.has( v1 ) );

		const c1 = onPath ? pathColor : _setDistanceColour( vertices, v1 );
		const c2 = onPath ? pathColor : _setDistanceColour( vertices, v2 );

		c1.toArray( colors, v1 * 3 );
		c2.toArray( colors, v2 * 3 );

	}

	function _setDistanceColour( vertices, vertexIndex ) {

		const vertex = vertices[ vertexIndex ];
		const distance = stations.getStation( vertex ).distance;

		return ( distance === Infinity ) ? unconnected : colours[ Math.floor( colourRange * distance / maxDistance ) ];

	}

};

Survey.prototype.setLegColourBySurvey = function ( mesh ) {

	const materials = this.ctx.materials;

	var node = this.selection.getNode();

	while ( node.children.length === 1 ) node = node.children[ 0 ];

	__set.clear();
	node.getSubtreeIds( __set );

	const surveyToColourMap = this.ctx.surveyColourMapper.getColourMap( node );

	mesh.setShading( __set, _colourSegment, materials.getLineMaterial() );

	function _colourSegment ( vertices, colors, v1, v2, survey ) {

		const colour = surveyToColourMap[ survey ];

		colour.toArray( colors, v1 * 3 );
		colour.toArray( colors, v2 * 3 );

	}

};

Survey.prototype.setLegColourByPath = function ( mesh ) {

	const routes = this.routes;
	const cfg = this.ctx.cfg;
	const materials = this.ctx.materials;

	const c1 = cfg.themeColor( 'routes.active' );
	const c2 = cfg.themeColor( 'routes.adjacent' );
	const c3 = cfg.themeColor( 'routes.default' );

	mesh.setShading( this.selection.getIds(), _colourSegment, materials.getLineMaterial() );

	function _colourSegment ( vertices, colors, v1, v2 /*, survey */ ) {

		var colour;

		if ( routes.inCurrentRoute( v1 ) ) {

			colour = c1;

		} else if ( routes.adjacentToRoute( v1 ) ) {

			colour = c2;

		} else {

			colour = c3;
		}

		colour.toArray( colors, v1 * 3 );
		colour.toArray( colors, v2 * 3 );

	}

};

Survey.prototype.setLegColourByInclination = function ( mesh, pNormal ) {

	const colourCache = this.ctx.materials.colourCache;
	const colours = colourCache.getColors( 'inclination' );
	const materials = this.ctx.materials;

	const colourRange = colours.length - 1;
	const hueFactor = colourRange * 2 / Math.PI;
	const legNormal = new Vector3();

	// pNormal = normal of reference plane in model space

	mesh.setShading( this.selection.getIds(), _colourSegment, materials.getLineMaterial() );

	function _colourSegment ( vertices, colors, v1, v2 ) {

		const vertex1 = vertices[ v1 ];
		const vertex2 = vertices[ v2 ];

		legNormal.subVectors( vertex1, vertex2 ).normalize();

		const dotProduct = legNormal.dot( pNormal );

		const hueIndex = Math.floor( hueFactor * Math.acos( Math.abs( dotProduct ) ) );
		const colour = colours[ hueIndex ];

		colour.toArray( colors, v1 * 3 );
		colour.toArray( colors, v2 * 3 );

	}

};

export { Survey };