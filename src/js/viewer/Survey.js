import {
	FACE_SCRAPS, FACE_WALLS,
	FEATURE_ENTRANCES, FEATURE_BOX, FEATURE_TRACES, FEATURE_GRID,
	FEATURE_STATIONS, SURVEY_WARNINGS, STATION_ENTRANCE,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE, LEG_DUPLICATE,
	LABEL_STATION, LABEL_STATION_COMMENT,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_OVERLAY,
	SHADING_SURVEY, SHADING_SINGLE, SHADING_SHADED, SHADING_PATH, SHADING_DEPTH_CURSOR, SHADING_DISTANCE,
	SHADING_SURFACE, CLUSTER_MARKERS, SHADING_DUPLICATE, SHADING_CUSTOM
} from '../core/constants';

import { Entrances } from './Entrances';
import { Stations } from './Stations';
import { StationLabels } from './StationLabels';
import { StationMarkers } from './StationMarkers';
import { Routes } from './Routes';
import { Legs } from './Legs';
import { DyeTraces } from './DyeTraces';
import { SurveyMetadata } from './SurveyMetadata';
import { LoxTerrain } from '../terrain/LoxTerrain';
import { buildWallsSync } from './walls/WallBuilders';
import { SurveyColourMapper} from '../core/SurveyColourMapper';
import { Selection } from './Selection';
import { SurveyBox } from '../core/SurveyBox';
import { Grid } from './Grid';

import { Matrix4, Vector3, Box3, Object3D, Color } from '../Three';
import proj4 from 'proj4';

const __set = new Set();
const white = new Color( 0xffffff );
const __v0 = new Vector3();
const __v1 = new Vector3();
const __v2 = new Vector3();

class Survey extends Object3D {

	constructor ( ctx, cave ) {

		super();

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
		this.duplicateShading = SHADING_DUPLICATE;
		this.wallsMode = false;
		this.hideMode = false;
		this.ctx = ctx;

		// objects targeted by raycasters and objects with variable LOD

		this.pointTargets = [];
		this.entranceTargets = [];

		this.type = 'CV.Survey';
		this.cutInProgress = false;
		this.features = new Map();
		this.routes = null;
		this.stations = null;
		this.terrain = null;
		this.segments = null;
		this.inverseWorld = new Matrix4();

		this.lightDirection = new Vector3( -1, -1, 2 ).normalize();

		const self = this;

		this.gradientName = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';

		ctx.surveyColourMapper = new SurveyColourMapper( ctx );
		ctx.survey = this;

		let survey = cave.getSurvey();

		if ( survey.limits.isEmpty() ) throw new Error( 'Empty survey or region of survey' );

		this.name = survey.title;
		this.CRS = survey.sourceCRS;
		this.displayCRS = survey.displayCRS;

		this.limits = survey.limits;
		this.offsets = survey.offsets;

		const modelLimits = this.limits.clone();

		modelLimits.min.sub( this.offsets );
		modelLimits.max.sub( this.offsets );

		this.modelLimits = modelLimits;
		this.combinedLimits = modelLimits;
		this.maxDistance = 0;

		// this needs to be defined before loading the leg data to
		// allow correct leg lengths to be calculated

		_setProjectionScale();

		this.loadCave( survey, cave.messages );

		this.loadWarnings( cave.messages );

		this.loadEntrances();

		this.setFeatureBox();

		this.addStatic( this.markers );

		this.addFeature( new Grid( ctx ), FEATURE_GRID, 'Grid' );

		this.addEventListener( 'removed', this.onRemoved );

		let zScale = 0.5;

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

			// set up projection from model to original CRS
			const transform = proj4( displayCRS, survey.sourceCRS );
			self.projection = transform;

			// calculate lat/long distortion between CRS and display
			const p1 = self.limits.min.clone();
			const p2 = self.limits.max.clone();

			p1.z = 0;
			p2.z = 0;

			const l1 = p1.distanceTo( p2 );

			p1.copy( transform.forward( p1 ) );
			p2.copy( transform.forward( p2 ) );

			const l2 = p1.distanceTo( p2 );

			self.scaleFactor = l1 / l2;

			self.projectionWGS84 = proj4( 'WGS84', survey.displayCRS );

		}

	}

}

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

Survey.prototype.loadWarnings = function ( messages ) {

	const selection = this.selection;

	if ( messages.length > 0 ) {

		let errorMarkers = this.getFeature( SURVEY_WARNINGS );

		if ( ! errorMarkers ) errorMarkers = new StationMarkers( this.ctx, 0xff00ff );

		messages.forEach( message => {

			const node = message.station;

			if ( node !== undefined && selection.contains( node.id ) ) {

				errorMarkers.mark( node );
				node.messageText = message.text;

			}

		} );

		this.addFeature( errorMarkers, SURVEY_WARNINGS, 'CV.Survey:warnings' );

	}

};

Survey.prototype.refreshColors = function () {

	this.removeFeature( this.entrances );
	this.entrances = null;

	this.loadEntrances();

	this.removeFeature( this.featureBox );
	this.featureBox = null;

	this.setFeatureBox();

	this.setShadingMode( this.caveShading );
	this.setSurfaceShading( this.surfaceShading );
	this.setDuplicateShading( this.duplicateShading );

};

Survey.prototype.loadEntrances = function () {

	const entrances = new Entrances( this.ctx, this );

	this.addFeature( entrances, FEATURE_ENTRANCES, 'CV.Survey:entrances' );

	this.entranceTargets = [ entrances.markers ];
	this.entrances = entrances;

};

Survey.prototype.setupTerrain = function ( terrain ) {

	// expand limits with terrain
	this.combinedLimits = terrain.boundingBox.clone().union( this.modelLimits );
	this.setFeatureBox();

	if ( terrain.isFlat ) return;

	this.removeFeature( this.getFeature( FEATURE_GRID ) );

	this.addFeature( new Grid( this.ctx ), FEATURE_GRID );

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
		if ( ! ( node.type & STATION_ENTRANCE ) ) return;
		points.push( node );

	}

};

Survey.prototype.loadCave = function ( survey, messages ) {

	const self = this;
	const ctx = this.ctx;
	const splayFix = survey.splayFix;

	const surveyTree = survey.surveyTree;

	this.surveyTree = surveyTree;

	this.selection = new Selection( ctx, ctx.cfg.themeValue( 'box.select' ) );

	_loadSegments( survey.lineSegments );

	this.loadStations( surveyTree );

	_loadTerrain( survey );

	this.computeBoundingBoxes( surveyTree );

	this.pointTargets.push( this.stations );

	const metadata = new SurveyMetadata( this.name, survey.metadata );

	this.metadata = metadata;

	this.loadDyeTraces();

	this.segments = this.getFeature( LEG_CAVE ).findTopology();

	this.routes = new Routes( this );

	buildWallsSync( survey, this );

	return;

	function _loadSegments ( srcSegments ) {

		const l = srcSegments.length;
		const typeLegs = [];

		typeLegs[ LEG_CAVE    ] = { vertices: [], runs: [] };
		typeLegs[ LEG_SURFACE ] = { vertices: [], runs: [] };
		typeLegs[ LEG_SPLAY   ] = { vertices: [], runs: [] };
		typeLegs[ LEG_DUPLICATE ] = { vertices: [], runs: [] };

		let legs, run;
		let currentType;
		let currentSurvey;

		if ( l === 0 ) return null;

		for ( let i = 0; i < l; i++ ) {

			const leg = srcSegments[ i ];
			const survey = leg.survey;

			let type = leg.type;

			legs = typeLegs[ type ];

			if ( legs === undefined ) {

				console.warn( 'unknown segment type: ', type );
				break;

			}

			if ( splayFix && type === LEG_SPLAY ) {

				if ( leg.to.splays > -1 ||
					( leg.from.connections != 0 && leg.to.connections != 0 ) ) {

					leg.to.connections++;

					messages.push( { station: leg.to, text: 'splay fault' } );

					legs = typeLegs[ LEG_CAVE ];
					type = LEG_CAVE;

				}

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
		_addModelSegments( LEG_DUPLICATE, 'CV.Survey:cave:duplicate' );

		return;

		function _addModelSegments ( tag, name ) {

			const legs = typeLegs[ tag ];

			if ( legs.vertices.length === 0 ) return;

			const legObject = new Legs( ctx );

			legObject.addLegs( self, legs.vertices, legs.runs );

			self.addFeature( legObject, tag, name + ':g' );

		}

	}

	function _loadTerrain ( cave ) {

		if ( cave.hasTerrain === false ) return;

		const terrain = new LoxTerrain( ctx, cave.terrains, self.offsets );

		self.terrain = terrain;

		return;

	}

};

Survey.prototype.getFeature = function ( tag ) {

	return this.features.get( tag );

};

Survey.prototype.update = function ( cameraManager, target  ) {

	const camera = cameraManager.activeCamera;

	const entrances = this.features.get( FEATURE_ENTRANCES );

	if ( entrances && cameraManager.testCameraLayer( FEATURE_ENTRANCES ) ) {

		cameraManager.setCameraLayer( CLUSTER_MARKERS, true );
		entrances.cluster( cameraManager, target, this.selection );

	} else {

		cameraManager.setCameraLayer( CLUSTER_MARKERS, false );

	}

	const stationLabels = this.features.get( LABEL_STATION );

	if ( ! stationLabels ) return;

	if ( ( cameraManager.testCameraLayer( LABEL_STATION ) ) ||
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

	if ( obj === null ) return;

	const features = this.features;

	features.forEach( ( value, key ) => { if ( value === obj ) features.delete( key ); } );

	this.layers.mask &= ~ obj.layers.mask;
	obj.removeFromParent();

};

Survey.prototype.hasFeature = function ( tag ) {

	return this.features.has( tag );

};

Survey.prototype.loadStations = function ( surveyTree ) {

	const stations = new Stations( this );

	let commentCount = 0;

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

		if ( node.isStation() ) {

			parent.boundingBox.expandByPoint( node );
			parent.stationCount++;

		} else if ( parent ) {

			if ( node.children.length === 0 || node.boundingBox.isEmpty() ) return;

			parent.boundingBox.union( node.boundingBox );

		}

	}

};

Survey.prototype.loadDyeTraces = function () {

	const dyeTraces = new DyeTraces( this.ctx );

	this.addFeature( dyeTraces, FEATURE_TRACES, 'CV.DyeTraces' );

	this.dyeTraces = dyeTraces;

};

Survey.prototype.setScale = function ( hScale, vScale ) {

	this.scale.set( hScale, hScale, vScale );

	this.updateMatrix();
	this.updateMatrixWorld();
	this.inverseWorld.copy( this.matrixWorld ).invert();
	this.worldBoundingBox = this.combinedLimits.clone().applyMatrix4( this.matrixWorld );

};

Survey.prototype.getLegs = function () {

	return this.getFeature( LEG_CAVE ).legVertices;

};

Survey.prototype.getRoutes = function () {

	return this.routes;

};

Survey.prototype.getWorldPosition = function ( position ) {

	return position.applyMatrix4( this.matrixWorld );

};

Survey.prototype.getGeographicalPosition = function ( position, vector = false ) {

	const offsets = this.offsets;
	const projection = this.projection;

	__v0.x = position.x + offsets.x;
	__v0.y = position.y + offsets.y;

	// convert to original survey CRS
	const p = ( projection == null ) ? __v0 : projection.forward( __v0 );

	return vector !== false
		? vector.set( p.x, p.y, position.z + offsets.z )
		: new Vector3( p.x, p.y, position.z + offsets.z );

};

Survey.prototype.getGeographicalDistance = function ( v1, v2 ) {

	const p1 = this.getGeographicalPosition( v1, __v1 );
	const p2 = this.getGeographicalPosition( v2, __v2 );

	return p1.distanceTo( p2 );

};

Survey.prototype.getModelSurfaceFromWGS84 = function ( position, callback ) {

	const offsets = this.offsets;

	position.copy( this.projectionWGS84.forward( position ) );

	this.terrain.getHeights( [ position ], _handleResult );

	return;

	function _handleResult ( points ) {

		position.z = points[ 0 ].z;
		position.sub( offsets );

		callback();

	}

};

Survey.prototype.setShortestPaths = function ( station ) {

	const legs = this.getFeature( LEG_CAVE );

	this.highlightPath = null;

	this.markers.clear();

	// reset distances to unknown
	this.stations.resetPaths();

	this.maxDistance = legs.setShortestPaths( station );

	this.markers.mark( station );

	this.setShadingMode( SHADING_DISTANCE );

};

Survey.prototype.showShortestPath = function ( station ) {

	const legs = this.getFeature( LEG_CAVE );

	this.highlightPath = legs.getShortestPath( station );

	if ( this.lastMarkedStation !== null ) this.markers.unmark( this.lastMarkedStation );

	this.markers.mark( station );

	this.lastMarkedStation = station;

	this.setLegShading( LEG_CAVE, SHADING_DISTANCE );

};

Survey.prototype.getMaxDistance = function () {

	return this.maxDistance;

};

Survey.prototype.selectStation = function ( station ) {

	this.stations.selectStation( station );

};

Survey.prototype.highlightSelection = function ( node ) {

	let box = this.highlightBox;

	if ( node.isStation() ) {

		this.stations.highlightStation( node );
		if ( box ) box.set( this.surveyTree );

	} else {

		if ( box === null ) {

			box = new Selection( this.ctx, this.ctx.cfg.themeValue( 'box.highlight' ) );
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

		const box = new SurveyBox( this.ctx, this.combinedLimits, this.ctx.cfg.themeColorCSS( 'box.bounding' ) );

		this.addFeature( box, FEATURE_BOX, 'survey-boundingbox' );
		this.featureBox = box;

	} else {

		this.featureBox.update( this.combinedLimits );

	}

	this.worldBoundingBox = this.combinedLimits.clone().applyMatrix4( this.matrixWorld );

};

Survey.prototype.getWorldBoundingBox = function () {

	return this.worldBoundingBox;

};

Survey.prototype.cutSection = function ( node ) {

	const selection = this.selection;
	const self = this;

	selection.set( node );

	if ( selection.isEmpty() ) return;

	// clear target lists

	this.pointTargets = [];
	this.entranceTargets = [];

	this.terrain = null;

	// iterate through objects replace geometries and remove bounding boxes;

	const cutList = []; // list of Object3D's to remove from survey - workaround for lack of traverseReverse

	this.traverse( _cutObject );

	cutList.forEach( obj => {

		// dispose of all geometry of this object and descendants

		if ( obj.geometry ) obj.geometry.dispose();
		this.removeFeature( obj );

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

	this.limits.copy( this.modelLimits ).translate( this.offsets );

	this.featureBox = null;
	this.setFeatureBox();
	this.addFeature( new Grid( this.ctx ), FEATURE_GRID );

	this.worldBoundingBox = null;

	this.loadEntrances();

	// this.loadWarnings();
	// this.loadDyeTraces();

	const legs = this.getFeature( LEG_CAVE );
	this.sections = legs.findTopology();

	this.cutInProgress = true;

	return;

	function _cutObject ( obj ) {

		switch ( obj.type ) {

		case 'Legs':
		case 'Walls':

			if ( ! obj.cutRuns( self, selection ) ) cutList.push( obj );

			break;

		case 'CV.SurveyBox':
		case 'CV.Stations':
		case 'CV.StationLabels':
		case 'CV.ClusterMarker':
		case 'CV.Grid':

			cutList.push( obj );

			break;

		case 'Group':

			break;

		}

	}

};

Survey.prototype.getBounds = function () {

	const box = new Box3();

	this.traverse( _addObjectBounds );

	return box;

	function _addObjectBounds ( obj ) {

		if ( obj.type === 'CV.Survey' || obj.type === 'CV.Box3' ) return;
		// skip survey which is positioned/scaled into world space

		const geometry = obj.geometry;

		if ( geometry && geometry.boundingBox ) {

			box.union( geometry.boundingBox );

		}

	}

};

Survey.prototype.setWallsMode = function ( mode ) {

	const walls = this.getFeature( FACE_WALLS );
	const scraps = this.getFeature( FACE_SCRAPS );

	if ( walls ) walls.setFlat( mode );
	if ( scraps ) scraps.setFlat( mode );

	this.wallsMode = mode;

};

Survey.prototype.setHideMode = function ( mode ) {

	const legs = this.getFeature( LEG_CAVE );

	if ( legs ) legs.hide( mode );

	this.hideMode = mode;

};

Survey.prototype.setShadingMode = function ( mode, filterConnected ) {

	const materials = this.ctx.materials;

	let surfaceMaterial;

	switch ( mode ) {

	case SHADING_HEIGHT:

		surfaceMaterial = materials.getHeightMaterial();

		break;

	case SHADING_CURSOR:

		surfaceMaterial = materials.getCursorMaterial();

		break;

	case SHADING_SINGLE:

		surfaceMaterial = materials.getSurfaceMaterial();

		break;

	case SHADING_DEPTH:

		if ( this.terrain === null ) return false;

		surfaceMaterial = materials.getDepthMaterial();

		if ( ! surfaceMaterial ) return false;

		break;

	case SHADING_DEPTH_CURSOR:

		if ( this.terrain === null ) return false;

		surfaceMaterial = materials.getDepthCursorMaterial();

		if ( ! surfaceMaterial ) return false;

		break;

	case SHADING_DISTANCE:
	case SHADING_SURVEY:

		surfaceMaterial = false;

		break;

	}

	this.markers.setVisibility( ( mode === SHADING_DISTANCE ) );

	if ( this.setLegShading( LEG_CAVE, mode, { dashed: false, focus: false }, filterConnected ) ) {

		this.setWallShading( this.features.get( FACE_WALLS  ), surfaceMaterial );
		this.setWallShading( this.features.get( FACE_SCRAPS ), surfaceMaterial );

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

	if ( this.setLegShading( LEG_SURFACE, mode, { dashed: true, focus: false } ) ) {

		this.surfaceShading = mode;

	}

	return this.surfaceShading;

};

Survey.prototype.setDuplicateShading = function ( mode ) {

	if ( this.setLegShading( LEG_DUPLICATE, mode, { dashed: true, focus: false } ) ) {

		this.duplicateShading = mode;

	}

	return this.duplicateShading;

};

Survey.prototype.setLegShading = function ( legType, legShadingMode, options, filterConnected ) {

	const legs = this.features.get( legType );

	if ( legs === undefined ) return false;

	const cfg = this.ctx.cfg;

	switch ( legShadingMode ) {

	case SHADING_HEIGHT:

		this.setLegColourByMaterial( legs, 'height', options, filterConnected );
		break;

	case SHADING_LENGTH:

		this.setLegColourByLength( legs, options, filterConnected );
		break;

	case SHADING_INCLINATION:

		this.setLegColourByInclination( legs, options, filterConnected );
		break;

	case SHADING_CURSOR:

		this.setLegColourByMaterial( legs, 'cursor', options, filterConnected );
		break;

	case SHADING_DEPTH_CURSOR:

		this.setLegColourByMaterial( legs, 'depth-cursor', options, filterConnected );
		break;

	case SHADING_SINGLE:

		this.setLegColourByColour( legs, cfg.themeColor( 'shading.single' ), options, filterConnected );
		break;

	case SHADING_SURFACE:

		this.setLegColourByColour( legs, cfg.themeColor( 'shading.surface' ), options, filterConnected );
		break;

	case SHADING_DUPLICATE:

		this.setLegColourByColour( legs, cfg.themeColor( 'shading.duplicate' ), options, filterConnected );
		break;

	case SHADING_CUSTOM:

		this.setLegCustomColor( legs, options, filterConnected );
		break;

	case SHADING_SURVEY:

		this.setLegColourBySurvey( legs, options, filterConnected );
		break;

	case SHADING_PATH:

		this.setLegColourByPath( legs, options );
		break;

	case SHADING_OVERLAY:

		break;

	case SHADING_SHADED:

		break;

	case SHADING_DEPTH:

		this.setLegColourByMaterial( legs, 'depth', options, filterConnected );
		break;

	case SHADING_DISTANCE:

		this.setLegColourByDistance( legs, options );
		break;

	default:

		console.warn( 'invalid leg shading mode' );
		return false;

	}

	return true;

};

Survey.prototype.setLegColourByMaterial = function ( mesh, mode, options, filterConnected ) {

	mesh.setShading( this.selection.getIds(), _colourSegment, mode, options, filterConnected );

	function _colourSegment ( vertices, colors, v1, v2 ) {

		white.toArray( colors, v1 * 3 );
		white.toArray( colors, v2 * 3 );

	}

};

Survey.prototype.setLegColourByColour = function ( mesh, colour, options, filterConnected ) {

	mesh.setShading( this.selection.getIds(), _colourSegment, 'basic', options, filterConnected );

	function _colourSegment ( vertices, colors, v1, v2 ) {

		colour.toArray( colors, v1 * 3 );
		colour.toArray( colors, v2 * 3 );

	}

};

Survey.prototype.setLegCustomColor = function ( mesh, options, filterConnected ) {

	mesh.setShading( this.selection.getIds(), _colourSegment, 'basic', options, filterConnected );

	function _colourSegment() {}

};

Survey.prototype.setLegColourByLength = function ( mesh, options, filterConnected ) {

	const materials = this.ctx.materials;
	const colours = materials.colourCache.getColorSet( this.gradientName );
	const colourRange = colours.length - 1;
	const stats = mesh.stats;
	const legLengths = mesh.legLengths;

	mesh.setShading( this.selection.getIds(), _colourSegment, 'basic', options, filterConnected );

	function _colourSegment ( vertices, colors, v1, v2 ) {

		const relLength = ( legLengths[ v1 / 2 ] - stats.minLegLength ) / stats.legLengthRange;
		const colour = colours[ Math.floor( relLength * colourRange ) ];

		colour.toArray( colors, v1 * 3 );
		colour.toArray( colors, v2 * 3 );

	}

};

Survey.prototype.setLegColourByDistance = function ( mesh, options, filterConnected ) {

	const cfg = this.ctx.cfg;
	const materials = this.ctx.materials;

	const colours = materials.colourCache.getColorSet( this.gradientName );
	const unconnected = cfg.themeColor( 'shading.unconnected' );
	const pathColor = cfg.themeColor( 'routes.active' );

	const colourRange = colours.length - 1;

	if ( this.maxDistance === 0 ) {

		if ( this.entrances ) {

			let maxDistance = 0;

			// reset distances to unknown
			this.stations.resetPaths();

			this.highlightPath = null;
			this.markers.clear();

			this.entrances.forEachEntrance( e => maxDistance = Math.max( maxDistance, mesh.setShortestPaths( e ) ) );

			this.maxDistance = maxDistance;

		}

	}

	const maxDistance = this.maxDistance;
	const path = this.highlightPath;

	mesh.setShading( this.selection.getIds(), _colourSegment, 'basic', options, filterConnected );

	function _colourSegment ( vertices, colors, v1, v2 ) {

		const onPath = ( path !== null && path.has( v1 ) );

		const c1 = onPath ? pathColor : _setDistanceColour( vertices, v1 );
		const c2 = onPath ? pathColor : _setDistanceColour( vertices, v2 );

		c1.toArray( colors, v1 * 3 );
		c2.toArray( colors, v2 * 3 );

	}

	function _setDistanceColour( vertices, vertexIndex ) {

		const vertex = vertices[ vertexIndex ];
		const distance = vertex.shortestPath;

		return ( distance === Infinity ) ? unconnected : colours[ Math.floor( colourRange * distance / maxDistance ) ];

	}

};

Survey.prototype.setLegColourBySurvey = function ( mesh, options, filterConnected ) {

	let node = this.selection.getNode();

	while ( node.children.length === 1 ) node = node.children[ 0 ];

	__set.clear();
	node.getSubtreeIds( __set );

	const surveyToColourMap = this.ctx.surveyColourMapper.getColourMap( node );

	mesh.setShading( __set, _colourSegment, 'basic', options, filterConnected );

	function _colourSegment ( vertices, colors, v1, v2, survey ) {

		const colour = surveyToColourMap[ survey ];

		colour.toArray( colors, v1 * 3 );
		colour.toArray( colors, v2 * 3 );

	}

};

Survey.prototype.setLegColourByPath = function ( mesh, options ) {

	const routes = this.routes;
	const cfg = this.ctx.cfg;

	const c1 = cfg.themeColor( 'routes.active' );
	const c2 = cfg.themeColor( 'routes.adjacent' );
	const c3 = cfg.themeColor( 'routes.default' );

	mesh.setShading( this.selection.getIds(), _colourSegment, 'basic', options );

	function _colourSegment ( vertices, colors, v1, v2 /*, survey */ ) {

		const segment = mesh.vertexSegment( v1 );
		let colour;

		if ( routes.inCurrentRoute( segment ) ) {

			colour = c1;

		} else if ( routes.adjacentToRoute( segment ) ) {

			colour = c2;

		} else {

			colour = c3;
		}

		colour.toArray( colors, v1 * 3 );
		colour.toArray( colors, v2 * 3 );

	}

};

Survey.prototype.setLegColourByInclination = function ( mesh, options, filterConnected ) {

	const colourCache = this.ctx.materials.colourCache;
	const colours = colourCache.getColorSet( 'inclination' );

	const colourRange = colours.length - 1;
	const hueFactor = colourRange * 2 / Math.PI;
	const legNormal = new Vector3();

	mesh.setShading( this.selection.getIds(), _colourSegment, 'basic', options, filterConnected );

	function _colourSegment ( vertices, colors, v1, v2 ) {

		const vertex1 = vertices[ v1 ];
		const vertex2 = vertices[ v2 ];

		legNormal.subVectors( vertex1, vertex2 ).normalize();

		const dotProduct = legNormal.dot( Object3D.DefaultUp );

		const hueIndex = Math.floor( hueFactor * Math.acos( Math.abs( dotProduct ) ) );
		const colour = colours[ hueIndex ];

		colour.toArray( colors, v1 * 3 );
		colour.toArray( colors, v2 * 3 );

	}

};

export { Survey };