
import {
	Vector3,
	Geometry,
	LineBasicMaterial,
	LineSegments,
	EventDispatcher
} from '../../../../three.js/src/Three.js';

import { replaceExtention } from '../core/lib.js';
import { getEnvironmentValue } from '../core/constants.js';
import { CaveLoader } from '../loaders/CaveLoader.js';


function Routes ( surveyName, callback ) {

	// determine segments between junctions and entrances/passage ends and create mapping array.

	this.surveyTree = null;
	this.segments = []; // maps vertex index to segment membership
	this.segmentMap = new Map(); // maps segments of survey between ends of passages and junctions.
	this.segmentToInfo = {};

	this.adjacencies = new Map();

	this.routes = new Map();
	this.routeNames = [];

	this.currentRoute = new Set();
	this.currentRouteName;
	this.adjacentSegments = new Set();

	var prefix = getEnvironmentValue( "surveyDirectory", "" );

	var self = this;
	var name = replaceExtention( surveyName, "json" );

	var segmentMap = this.segmentMap;

	console.log( "loading route file: ", name );

	var loader = new CaveLoader( _routesLoaded );

	loader.loadURL( name );

	Object.defineProperty( this, "setRoute", {
		set: function ( x ) { this.loadRoute( x ) },
		get: function () { return this.currentRouteName }
	} );

	function _routesLoaded( routes ) {

		if ( ! routes ) {

			callback( [] );
			return;

		}

		var routesJSON = routes.getRoutes();

		var routes = routesJSON.routes;

		if ( ! routes ) {

			alert( "invalid route file - no routes" );

			callback( [] );
			return;

		}

		var route;

		for ( var i = 0; i < routes.length; i++ ) {

			route = routes[ i ]

			self.routeNames.push( route.name );
			self.routes.set( route.name, route.segments );

		}

		callback( self.routeNames );

		self.dispatchEvent( { type: "changed" } );

	}

}

Routes.prototype.constructor = Routes;

Object.assign( Routes.prototype, EventDispatcher.prototype );

Routes.prototype.mapSurvey = function ( stations, legs, surveyTree ) {

	// determine segments between junctions and entrances/passage ends and create mapping array.

	this.surveyTree = surveyTree;

	var segmentMap = this.segmentMap;
	var newSegment = true;

	var station;

	var segment = 0;
	var segments = this.segments;
	var adjacencies = this.adjacencies;
	var segmentToInfo = this.segmentToInfo;

	var v1, v2;

	var l = legs.length;

	var startStationId;
	var startVertex;
	var segmentInfo;

	for ( var i = 0; i < l; i = i + 2 ) {

		v1 = legs[ i ];
		v2 = legs[ i + 1 ];

		segments.push( segment );

		if ( newSegment ) {

			station = stations.getStation( v1 );

			startStationId = station.id;
			startVertex = v1;

			newSegment = false;

			_addAdjacency( v1 );

		}

		station = stations.getStation( v2 );

		if ( ( station && station.hitCount > 2 ) || ( i + 2 < l && ! v2.equals( legs[ i + 2 ] ) ) ) {

			// we have found a junction or a passage end
			segmentInfo = { segment: segment, startVertex: startVertex, endVertex: v2 };

			segmentMap.set( startStationId + ":" + station.id, segmentInfo );
			segmentToInfo[ segment ] = segmentInfo;

			_addAdjacency( v2 );

			segment++;

			newSegment = true;

		}

	}

	if ( ! newSegment ) {

		segmentMap.set( startStationId + ":" + station.id, { segment: segment, startVertex: startVertex, endVertex: v2 } );

		_addAdjacency( v2 );

	}

	function _addAdjacency( vertex ) {

		var vertexKey = vertex.x + ":" + vertex.y + ":" + vertex.z;

		if ( adjacencies.has( vertexKey ) ) {

			adjacencies.get( vertexKey ).push( segment );

		} else {

			adjacencies.set( vertexKey, [ segment ] );

		}

	}

}

Routes.prototype.createWireframe = function () {

	var geometry = new Geometry();
	var vertices = geometry.vertices;

	this.segmentMap.forEach( _addSegment );

	return new LineSegments( geometry , new LineBasicMaterial( { color: 0x00ff00 } ) );

	function _addSegment( value, key ) {

		vertices.push( value.startVertex );
		vertices.push( value.endVertex );

	}

}

Routes.prototype.loadRoute = function ( routeName ) {

	var self = this;

	var surveyTree = this.surveyTree;
	var currentRoute = this.currentRoute;
	var segmentMap = this.segmentMap;
	var routes = this.routes;

	var map;
	var segment;

	var routeSegments = this.routes.get( routeName );

	if ( ! routeSegments ) {

		 alert( "route " + routeName + " does not exist" );
		 return false;

	 }

	currentRoute.clear();

	for ( var i = 0; i < routeSegments.length; i++ ) {

		segment = routeSegments[ i ];

		map = segmentMap.get( surveyTree.getIdByPath( segment.start.split( "." ) ) + ":" + surveyTree.getIdByPath( segment.end.split( "." ) ) );

		if ( map !== undefined ) currentRoute.add( map.segment );

	}

	this.currentRouteName = routeName;

	console.log(" route ", routeName, " loaded." );

	self.dispatchEvent( { type: "changed" } );

	return true;

}

Routes.prototype.getCurrentRoute = function () {

	return this.currentRoute;

}

Routes.prototype.toDownload = function () {

	// dump dump of json top window for cut and paste capture

	var route = this.currentRoute;
	var stations = this.stations;
	var segmentMap = this.segmentMap;

	var routeName = "test";
	var routeSegments;

	var routesJSON = {
		name: "test",
		routes: []
	}

	this.routes.forEach( _addRoutes );

	return 'data:text/json;charset=utf8,' + encodeURIComponent( JSON.stringify( routesJSON ) );

	function _addRoutes( route, routeName ) {

		routeSegments = [];

		segmentMap.forEach( _addRoute );

		routesJSON.routes.push( { name: routeName, segments: RouteSegments } );

	}

	function _addRoute( value, key ) {

		if ( route.has( value.segment ) ) {

			routeSegments.push( { 
				start: stations.getStation( value.startVertex ).getPath(), 
				end: stations.getStation( value.endVertex ).getPath()
			} );

		}

	}

}

Routes.prototype.getRouteNames = function() {

	return this.routeNames;

}

Routes.prototype.toggleSegment = function ( index ) {

	var self = this;
	var route = this.currentRoute;
	var segment = this.segments[ index / 2 ];

	this.adjacentSegments.clear();

	if ( route.has( segment ) ) {

		route.delete( segment );

	} else {

		route.add( segment );

		// handle adjacent segments to the latest segment toggled "on"

		var segmentInfo = this.segmentToInfo[ segment ];

		if ( segmentInfo !== undefined ) {

			this.adjacencies.get( _vertexKey( segmentInfo.startVertex ) ).forEach( _setAdjacentSegments );
			this.adjacencies.get( _vertexKey( segmentInfo.endVertex ) ).forEach( _setAdjacentSegments );

		}

	}

	return;

	function _vertexKey( vertex ) {

		return vertex.x + ":" + vertex.y + ":" + vertex.z;

	}

	function _setAdjacentSegments( segment ) {

		if  ( ! route.has( segment ) ) self.adjacentSegments.add( segment );

	}

}

Routes.prototype.inCurrentRoute = function ( index ) {

	return this.currentRoute.has( this.segments[ index / 2 ] );

}

Routes.prototype.adjacentToRoute = function ( index ) {

	return this.adjacentSegments.has( this.segments[ index / 2 ] );

}

export { Routes };

