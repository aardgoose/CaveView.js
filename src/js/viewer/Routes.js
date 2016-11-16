
import {
	Vector3,
	Geometry,
	LineBasicMaterial,
	LineSegments
} from '../../../../three.js/src/Three.js';

import { getEnvironmentValue } from '../core/constants.js';
import { CaveLoader } from '../loaders/CaveLoader.js';


function Routes ( surveyName, callback ) {

	// determine segments between junctions and entrances/passage ends and create mapping array.

	this.segments = []; // maps vertex index to segment membership
	this.segmentMap = new Map(); // maps segments of survey between ends of passages and junctions.
	this.currentRoute = new Set();
	this.routes = new Map();
	this.routeNames = [];

	var prefix = getEnvironmentValue( "surveyDirectory", "" );

	var self = this;
	var name = surveyName.split( "." ).shift() + ".json";

	var segmentMap = this.segmentMap;

	console.log( "loading route file: ", name );

	var loader = new CaveLoader( _routesLoaded );

	loader.loadURL( name );

	function _routesLoaded( routes ) {

		if ( routes === null ) {

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

	}

}

Routes.prototype.constructor = Routes;

Routes.prototype.mapSurvey = function ( stations, legs ) {

	// determine segments between junctions and entrances/passage ends and create mapping array.

	var segmentMap = this.segmentMap;
	var newSegment = true;

	var station;

	var segment = 0;
	var segments = this.segments;

	var v1, v2;

	var l = legs.length;

	var startStationId;
	var startVertex;

	for ( var i = 0; i < l; i = i + 2 ) {

		v1 = legs[ i ];
		v2 = legs[ i + 1 ];

		segments.push( segment );
		segments.push( segment );

		if ( newSegment ) {

			station = stations.getStation( v1 );

			startStationId = station.id;
			startVertex = v1;

			newSegment = false;

		}

		station = stations.getStation( v2 );

		if ( ( station && station.hitCount > 2 ) || ( i + 2 < l && ! v2.equals( legs[ i + 2 ] ) ) ) {

			// we have found a junction or a passage end

			segmentMap.set( startStationId + ":" + station.id, { segment: segment, startVertex: startVertex, endVertex: v2 } );

			segment++;

			newSegment = true;

		}

	}

	if ( ! newSegment ) {

		segmentMap.set( startStationId + ":" + station.id, { segment: segment, startVertex: startVertex, endVertex: v2 } );

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

Routes.prototype.loadRoute = function ( routeName, surveyTree ) {

	var self = this;

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

	var route = this.currentRoute;
	var segment = this.segments[ index ];

	route.has( segment ) ? route.delete( segment ) : route.add( segment );

}

Routes.prototype.inCurrentRoute = function ( index ) {

	return this.currentRoute.has( this.segments[ index ] );

}

export { Routes };

