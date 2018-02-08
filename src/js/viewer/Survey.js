
import {
	FACE_SCRAPS, FACE_WALLS,
	WALL_DIAMOND, WALL_SQUARE, WALL_OVAL,
	FEATURE_ENTRANCES, FEATURE_SELECTED_BOX, FEATURE_BOX, FEATURE_TRACES, FEATURE_STATIONS,
	LEG_CAVE, LEG_SPLAY, LEG_SURFACE, LABEL_STATION, STATION_ENTRANCE,
	MATERIAL_LINE, MATERIAL_SURFACE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH, SHADING_OVERLAY, SHADING_BECK,
	SHADING_SURVEY, SHADING_SINGLE, SHADING_SHADED, SHADING_PATH, SHADING_DEPTH_CURSOR, SHADING_AXIS, SHADING_DISTANCE,
	upAxis
} from '../core/constants';

import { Cfg } from '../core/lib';
import { ColourCache } from '../core/ColourCache';
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

import { Matrix4, Vector3, Box3, Object3D, Color, TextureLoader, PointsMaterial } from '../Three';
import { StencilLib } from '../core/StencilLib';

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

	// highlit point marker

	const pointerTexture = new TextureLoader().load( Cfg.value( 'home', '' ) + 'images/ic_location.png' );
	const pointerMaterial = new PointsMaterial( { size: 32, map: pointerTexture, transparent : true, sizeAttenuation: false, alphaTest: 0.8 } );

	const point = new Point( pointerMaterial );

	point.visible = false;

	this.add( point );

	this.stationHighlight = point;

	const self = this;

	SurveyColours.clearMap(); // clear cache of survey section to colour

	const survey = cave.getSurvey();

	this.name = survey.title;
	this.CRS = ( survey.sourceCRS === null ) ? Cfg.value( 'CRS', 'fred' ) : survey.sourceCRS;

	this.limits = survey.limits;
	this.offsets = survey.offsets;

	const modelLimits = new Box3().copy( this.limits );

	modelLimits.min.sub( this.offsets );
	modelLimits.max.sub( this.offsets );

	this.modelLimits = modelLimits;

	this.loadCave( survey );

	this.legTargets = [ this.features[ LEG_CAVE ] ];

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

		const limits = self.limits;

		const p1 = limits.min.clone();
		const p2 = limits.max.clone();

		p1.z = 0;
		p2.z = 0;

		const l1 = p1.distanceTo( p2 );

		const transform = proj4( survey.targetCRS, survey.sourceCRS ); // eslint-disable-line no-undef

		p1.copy( transform.forward( p1 ) );
		p2.copy( transform.forward( p2 ) );

		self.projection = transform;

		const l2 = p1.distanceTo( p2 );

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

		clusterMarkers.addMarker( node.p, ' ' + name + ' ' );

	}

};

Survey.prototype.calibrateTerrain = function ( terrain ) {

	var s1 = 0, s2 = 0, n = 0;

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

	_loadScraps( cave.scraps );
	_loadCrossSections( cave.crossSections );
	_loadTerrain( cave );

	this.computeBoundingBoxes( cave.surveyTree );

	this.pointTargets.push( this.stations );

	const metadata = new SurveyMetadata( this.name, cave.metadata );

	this.metadata = metadata;

	this.loadDyeTraces();

	this.routes = new Routes( metadata ).mapSurvey( this.stations, this.getFeature( LEG_CAVE ), this.surveyTree );

	return;

	function _loadScraps ( scrapList ) {

		const l = scrapList.length;

		if ( l === 0 ) return null;

		const mesh = self.getFeature( FACE_SCRAPS, Walls );

		const indices = [];
		const vertices = [];

		const indexRuns = [];

		var vertexOffset = 0;
		var i, lastEnd = 0;

		for ( i = 0; i < l; i++ ) {

			_loadScrap( scrapList[ i ] );

		}

		mesh.addWalls( vertices, indices, indexRuns );

		self.addFeature( mesh, FACE_SCRAPS, 'CV.Survey:faces:scraps' );

		return;

		function _loadScrap ( scrap ) {

			var i, l;

			for ( i = 0, l = scrap.vertices.length; i < l; i++ ) {

				vertices.push( scrap.vertices[ i ] );

			}

			for ( i = 0, l = scrap.faces.length; i < l; i++ ) {

				const face = scrap.faces[ i ];

				indices.push( face[ 0 ] + vertexOffset, face[ 2 ] + vertexOffset, face[ 1 ] + vertexOffset );

			}

			const end = indices.length;

			indexRuns.push( { start: lastEnd, count: end - lastEnd, survey: scrap.survey } );
			lastEnd = end;

			vertexOffset += scrap.vertices.length;

		}

	}

	function _loadCrossSections ( crossSectionGroups ) {

		const mesh = self.getFeature( FACE_WALLS, Walls );

		const indices = [];
		const vertices = [];

		const l = crossSectionGroups.length;

		// survey to face index mapping
		const indexRuns = [];

		var currentSurvey;

		var v = 0;

		var lastEnd = 0;
		var l1, r1, u1, d1, l2, r2, u2, d2;
		var ul1, ur1, dl1, dr1, ul2, ur2, dl2, dr2;
		var i, j;

		const cross = new Vector3();
		const lastCross = new Vector3();
		const nextCross = new Vector3();

		var run = null;

		var vertexCount; // number of vertices per section

		if ( l === 0 ) return;

		for ( i = 0; i < l; i++ ) {

			const crossSectionGroup = crossSectionGroups[ i ];
			const m = crossSectionGroup.length;

			if ( m < 2 ) continue;

			// enter first station vertices - FIXME use fudged approach vector for this (points wrong way).
			vertexCount = _getLRUD( crossSectionGroup[ 0 ], crossSectionGroup[ 1 ] );

			for ( j = 0; j < m; j++ ) {

				const xSect = crossSectionGroup[ j ];
				const survey = xSect.survey;

				vertexCount = _getLRUD( xSect, crossSectionGroup[ j + 1 ] );

				if ( survey !== currentSurvey ) {

					currentSurvey = survey;

					if ( run !== null ) {

						_endCap();

						lastEnd = indices.length;

						run.count = lastEnd - run.start;

						indexRuns.push( run );

						run = null;

					}

				}

				// next station vertices

				// triangles to form passage box
				l1 = v++;
				r1 = v++;
				u1 = v++;
				d1 = v++;

				if ( vertexCount === 8 ) {

					ul1 = v++;
					dr1 = v++;
					ur1 = v++;
					dl1 = v++;

				} else {

					ul1 = l1;
					dr1 = r1;
					ur1 = r1;
					dl1 = l1;

				}

				l2 = v++;
				r2 = v++;
				u2 = v++;
				d2 = v++;

				if ( vertexCount === 8 ) {

					ul2 = v++;
					dr2 = v++;
					ur2 = v++;
					dl2 = v++;

				} else {

					ul2 = l1;
					dr2 = r1;
					ur2 = r1;
					dl2 = l1;

				}

				// all face vertices specified in CCW winding order to define front side.

				if ( vertexCount === 4 ) {

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

				} else {

					// top faces - top half
					indices.push( u1, ur1, ur2 );
					indices.push( u1, ur2, u2 );
					indices.push( u1, u2,  ul2 );
					indices.push( u1, ul2, ul1 );

					// top faces - bottom half
					indices.push( ur1, r1, r2 );
					indices.push( ur1, r2, ur2 );
					indices.push( ul1, ul2, l2 );
					indices.push( ul1, l2, l1 );

					// bottom faces - top half
					indices.push( dr1, r2,  r1 );
					indices.push( dr1, dr2, r2 );
					indices.push( dl1, l2, dl2 );
					indices.push( dl1, l1, l2 );

					// bottom faces - bottom half
					indices.push( d1, dr2, dr1 );
					indices.push( d1, d2,  dr2 );
					indices.push( d1, dl2, d2 );
					indices.push( d1, dl1, dl2 );

				}

				v = v - vertexCount; // rewind to allow current vertices to be start of next box section.

				if ( run === null ) {

					// handle first section of run

					run = { start: lastEnd, survey: survey };

					// start tube with two triangles to form cap
					indices.push( u1, r1, d1 );
					indices.push( u1, d1, l1 );

					if ( vertexCount === 8 ) {

						indices.push( u1, l1, ul1 );
						indices.push( u1, ur1, r1 );
						indices.push( d1, dl1, l1 );
						indices.push( d1, r1, dr1 );

					}

				}

			}

			currentSurvey = null;
			v = v + vertexCount; // advance because we are starting a new set of independant x-sections.

		}

		if ( run !== null ) {

			_endCap();

			run.count = indices.length - run.start;

			indexRuns.push( run );

		}

		if ( indices.length === 0 ) return;

		mesh.addWalls( vertices, indices, indexRuns );

		self.addFeature( mesh, FACE_WALLS, 'CV.Survey:faces:walls' );

		return;

		function _endCap() {

			// close tube with two triangles
			indices.push( u2, r2, d2 );
			indices.push( u2, d2, l2 );

			if ( vertexCount === 8 ) {

				indices.push( u2, l2, ul2 );
				indices.push( u2, ur2, r2 );
				indices.push( d2, dl2, l2 );
				indices.push( d2, r2, dr2 );

			}

		}

		function _getLRUD ( crossSection, nextSection ) {

			const ovalFactor = 0.293;
			const station = crossSection.end;
			const lrud    = crossSection.lrud;

			// cross product of leg + next leg vector and up AXIS to give direction of LR vector
			cross.subVectors( crossSection.start, crossSection.end ).normalize();

			const vertical = ( Math.abs( cross.dot( upAxis ) ) > 0.97 );

			if ( nextSection ) {

				nextCross.subVectors( nextSection.start, nextSection.end ).normalize();
				cross.add( nextCross );

			}

			cross.cross( upAxis );

			var L, R, U, D, UL, UR, DL, DR;

			if ( vertical && ( lrud.u + lrud.d < 5 ) ) {

				cross.copy( lastCross );
				const t = cross.clone().cross( upAxis );

				U = t.clone().setLength( -lrud.u ).add( station );
				D = t.clone().setLength( lrud.d ).add( station );

			} else {

				U = new Vector3( station.x, station.y, station.z + lrud.u );
				D = new Vector3( station.x, station.y, station.z - lrud.d );

			}

			L = cross.clone().setLength(  lrud.l ).add( station );
			R = cross.clone().setLength( -lrud.r ).add( station );

			lastCross.copy( cross );

			switch ( crossSection.type ) {

			case WALL_DIAMOND:

				vertices.push( L );
				vertices.push( R );
				vertices.push( U );
				vertices.push( D );

				return 4; // number of vertices for this profile

			case WALL_SQUARE:

				UL = L.clone().setZ( U.z );
				UR = R.clone().setZ( U.z );
				DL = L.clone().setZ( D.z );
				DR = R.clone().setZ( D.z );

				vertices.push( UL );
				vertices.push( DR );
				vertices.push( UR );
				vertices.push( DL );

				return 4; // number of vertices for this profile

			case WALL_OVAL:

				vertices.push( L );
				vertices.push( R );
				vertices.push( U );
				vertices.push( D );

				UL = L.clone().setZ( U.z ).lerp( station, ovalFactor );
				UR = R.clone().setZ( U.z ).lerp( station, ovalFactor );
				DL = L.clone().setZ( D.z ).lerp( station, ovalFactor );
				DR = R.clone().setZ( D.z ).lerp( station, ovalFactor );

				vertices.push( UL );
				vertices.push( DR );
				vertices.push( UR );
				vertices.push( DL );

				return 8; // number of vertices for this profile

			default:

				console.error( 'unsupported lrud shape', crossSection.type );

			}

		}

	}

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

		o = new obj ( tag );

	}

	return o;

};

Survey.prototype.update = function ( camera, target ) {

	const cameraLayers = camera.layers;

	if ( this.features[ FEATURE_ENTRANCES ] && cameraLayers.mask & 1 << FEATURE_ENTRANCES ) {

		this.getFeature( FEATURE_ENTRANCES ).cluster( camera, target );

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
	const stationLabels = new StationLabels();

	surveyTree.traverse( _addStation );

	const legs = this.getLegs();

	var i, l;

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

Survey.prototype.setScale = function ( scale ) {

	this.stations.setScale( scale );

};

Survey.prototype.getWorldPosition = function ( position ) {

	return new Vector3().copy( position ).applyMatrix4( this.matrixWorld );

};

Survey.prototype.getGeographicalPosition = function ( position ) {

	const offsets = this.offsets;
	const projection = this.projection;

	var originalPosition = { x: position.x + offsets.x, y: position.y + offsets.y, z: 0 };

	// convert to original survey CRS

	if  ( projection !== null ) originalPosition = projection.forward( originalPosition );

	originalPosition.z = position.z + offsets.z;

	return originalPosition;

};

Survey.prototype.shortestPathSearch = function ( station ) {

	this.routes.shortestPathSearch( station );
	this.setShadingMode( SHADING_DISTANCE );

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

		this.add( box );

	} else {

		box.visible = true;
		box.update( node.boundingBox );

	}

	return box;

};

Survey.prototype.highlightSelection = function ( id ) {

	const surveyTree = this.surveyTree;
	const box = this.highlightBox;
	const highlight = this.stationHighlight;

	if ( id ) {

		const node = surveyTree.findById( id );

		if ( node.p === undefined && node.boundingBox !== undefined ) {

			this.highlightBox = this.boxSection( node, box, Cfg.themeValue( 'box.highlight' ) );

		} else if ( node.p ) {

			highlight.position.copy( node.p );
			highlight.visible = true;

		}

	} else {

		if ( box !== null ) box.visible = false;

		highlight.visible = false;

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

		} else {

			if ( node.p !== undefined ) this.stations.selectStation( node );

		}

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
		this.add( box );

	} else {

		this.featureBox.update( this.modelLimits );

	}

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

	const box = new Box3();

	const min = box.min;
	const max = box.max;

	this.traverse( _addObjectBounds );

	return box;

	function _addObjectBounds ( obj ) {

		if ( obj.type === 'CV.Survey' ) return; // skip survey which is positioned/scaled into world space

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

	case SHADING_SURVEY:

		// FIXME make multiple material for survey - > color and pass to Walls().

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
	case SHADING_BECK:

		material = false;

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

	case SHADING_BECK:

		this.setLegColourByColour( mesh, Cfg.themeColor( 'shading.single' ) );

		if ( this.wireframe === null ) {

			var wf = this.routes.createWireframe();
			wf.layers.set( LEG_CAVE );
			this.add( wf );
			this.wireframe = wf;
			wf.trim( 10 );

		}

//		this.getFeature( LEG_CAVE ).visible = false;

		break;

	case SHADING_SURVEY:

		this.setLegColourBySurvey( mesh );

		break;

	case SHADING_PATH:

		this.setLegColourByPath( mesh );

		break;

	case SHADING_AXIS:

		this.setLegColourByAxis( mesh );

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

Survey.prototype.setColourAxis = function ( c1, c2, c3 ) {

	this.colourAxis[ 0 ] = c1;
	this.colourAxis[ 1 ] = c2;
	this.colourAxis[ 2 ] = c3;

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