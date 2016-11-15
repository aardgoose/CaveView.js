
import {
	Vector3,
	Geometry,
	LineBasicMaterial,
	LineSegments
} from '../../../../three.js/src/Three.js';

import { getEnvironmentValue } from '../core/constants.js';

function Routes ( survey, mesh ) {

	// determine segments between junctions and entrances/passage ends and create mapping array.

	this.surveyTree = survey.surveyTree;
	this.workerPool = survey.workerPool;

	this.segmentMap = new Map();
	this.currentRoute = new Set();
	this.routes = new Map();
	this.routeNames = [];

	var segmentMap = this.segmentMap;
	var newSegment = true;

	var stations = survey.stations;
	var station;

	var segment = 0;
	var segments = [];

	var legs = mesh.geometry.vertices;

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

	mesh.userData.segments = segments;

	this.loadRoutes( survey.name.split( "." ).shift() );

}

Routes.prototype.constructor = Routes;

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

Routes.prototype.loadRoutes = function ( surveyName ) {

	var self = this;
	var name = surveyName + ".json";

	var prefix = getEnvironmentValue( "surveyDirectory", "" );
	var segmentMap = this.segmentMap;
	var surveyTree = this.surveyTree;

	this.currentRoute.clear();

	console.log( "loading route file: ", name );

	var worker = this.workerPool.getWorker();

	worker.onmessage = _routesLoaded;

	worker.postMessage( prefix + name );

	return;

	function _routesLoaded ( event ) {

		var routeData = event.data.survey; // FIXME check for ok;

		self.workerPool.putWorker( worker );

		console.log( event.data );

		var routes = routeData.routes;

		if ( ! routes ) {

			alert( "invalid route file - no routes" );
			return;

		}

		var route;

		for ( var i = 0; i < routes.length; i++ ) {

			route = routes[ i ]

			self.routeNames.push( route.name );
			self.routes.set( route.name, route.segments );

		}

	}

}

Routes.prototype.loadRoute = function ( routeName ) { // FIXME

	var self = this;

	var currentRoute = this.currentRoute;
	var segmentMap = this.segmentMap;
	var surveyTree = this.surveyTree;
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

Routes.prototype.dumpRoute = function () {

	// dump dump of json top window for cut and paste capture

	var route = this.currentRoute;
	var stations = this.stations;
	var routeName = "test";
	var routeSegments = [];

	this.segmentMap.forEach( _addRoute );

	var routeJSON = {
		name: routeName,
		segments: routeSegments
	}

	var url = 'data:text/json;charset=utf8,' + encodeURIComponent( JSON.stringify( routeJSON ) );

	window.open(url, '_blank');
	window.focus();

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

Routes.prototype.toggleSegment = function ( segment ) {

	var route = this.currentRoute;

	route.has( segment ) ? route.delete( segment ) : route.add( segment );

}

export { Routes };

