
import {
	Vector3,
	BufferGeometry, Float32BufferAttribute,
	LineBasicMaterial,
	LineSegments,
	EventDispatcher, Mesh, MeshBasicMaterial, Face3, DoubleSide
} from '../../../../three.js/src/Three';

import { replaceExtension } from '../core/lib';
import { getEnvironmentValue } from '../core/constants';
import { CaveLoader } from '../loaders/CaveLoader';
import { WaterMaterial } from '../materials/WaterMaterial';

function Routes ( surveyName, callback ) {

	// determine segments between junctions and entrances/passage ends and create mapping array.

	this.surveyTree = null;
	this.segments = []; // maps vertex index to segment membership
	this.segmentMap = new Map(); // maps segments of survey between ends of passages and junctions.
	this.segmentToInfo = {};

	this.routes = new Map();
	this.routeNames = [];

	this.currentRoute = new Set();
	this.currentRouteName;
	this.adjacentSegments = new Set();

	var prefix = getEnvironmentValue( "surveyDirectory", "" );

	var self = this;
	var name = replaceExtension( surveyName, "json" );

	var segmentMap = this.segmentMap;

	console.log( "loading route file: ", name );

	var loader = new CaveLoader( _routesLoaded );

	loader.loadURL( name );

	Object.defineProperty( this, "setRoute", {
		set: function ( x ) { this.loadRoute( x ) },
		get: function () { return this.currentRouteName }
	} );

	Object.defineProperty( this, "download", {
		get: function () { return this.toDownload() }
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

		self.dispatchEvent( { type: "changed", name: "download" } );

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
	var segmentToInfo = this.segmentToInfo;

	var v1, v2;

	var l = legs.length;

	var segmentInfo;

	for ( var i = 0; i < l; i = i + 2 ) {

		v1 = legs[ i ];
		v2 = legs[ i + 1 ];

		segments.push( segment );

		if ( newSegment ) {

			station = stations.getStation( v1 );

			segmentInfo = {
				segment: segment,
				startStation: station,
				endStation: null
			}

			station.linkedSegments.push( segment );

			newSegment = false;

		}

		station = stations.getStation( v2 );

		if ( ( station && station.hitCount > 2 ) || ( i + 2 < l && ! v2.equals( legs[ i + 2 ] ) ) ) {

			// we have found a junction or a passage end
			segmentInfo.endStation = station;

			segmentMap.set( segmentInfo.startStation.id + ":" + station.id, segmentInfo );
			segmentToInfo[ segment ] = segmentInfo;

			station.linkedSegments.push( segment );

			segment++;

			newSegment = true;

		}

	}

	if ( ! newSegment ) {

		segmentInfo.endVertex = v2;
		segmentInfo.endStation = station;

		segmentMap.set( segmentInfo.startStation.id + ":" + station.id, segmentInfo );

		station.linkedSegments.push( segment );

	}

}

Routes.prototype.createWireframe = function () {

	var geometry = new Geometry();
	var vertices = geometry.vertices;

	this.segmentMap.forEach( _addSegment );

	return new LineSegments( geometry , new LineBasicMaterial( { color: 0x00ff00 } ) );

	function _addSegment( value, key ) {

		vertices.push( value.startStation.p );
		vertices.push( value.endStation.p );

	}

}

Routes.prototype.createTest = function () {

	var geometry = new BufferGeometry();
	var vertices = [];
	var ends = [];
	var segmentCount = 0;

	this.segmentMap.forEach( _addSegment );

	var positions = new Float32BufferAttribute( vertices.length * 3, 3 );
	var sinks = new Float32BufferAttribute( ends.length * 3, 3 );

	geometry.addAttribute( 'position', positions.copyVector3sArray( vertices ) );
	geometry.addAttribute( 'sinks', sinks.copyVector3sArray( ends ) );

	var mesh = new Mesh( geometry , new WaterMaterial( new Vector3() ) );

	mesh.onBeforeRender = beforeRender;

	return mesh;

	function beforeRender (renderer, scene, camera, geometry, material, group ) {

		material.uniforms.offset.value += 0.1;

	}

	function _addSegment( value, key ) {

		var end = new Vector3().copy( value.endStation.p );

		var v = new Vector3().subVectors( value.endStation.p, value.startStation.p ).cross( new Vector3( 0, 0, 1 ) ).setLength( 2 );

		var v1 = new Vector3().add( value.startStation.p ).add( v );
		var v2 = new Vector3().add( value.startStation.p ).sub( v );

		vertices.push( v1 );
		vertices.push( v2 );
		vertices.push( end );

		ends.push ( end );
		ends.push ( end );
		ends.push ( end );

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

	self.dispatchEvent( { type: "changed", name: "" } );

	return true;

}

Routes.prototype.getCurrentRoute = function () {

	return this.currentRoute;

}

Routes.prototype.toDownload = function () {

	// dump dump of json top window for cut and paste capture

	var routesJSON = {
		name: "test",
		routes: []
	}

	this.routes.forEach( _addRoutes );

	return 'data:text/json;charset=utf8,' + encodeURIComponent( JSON.stringify( routesJSON ) );

	function _addRoutes( route, routeName ) {

		routesJSON.routes.push( { name: routeName, segments: route } );

	}

}

Routes.prototype.saveCurrent = function () {

	var segmentMap = this.segmentMap;
	var route = this.currentRoute;

	var routeSegments = [];

	segmentMap.forEach( _addRoute );

	function _addRoute( value, key ) {

		if ( route.has( value.segment ) ) {

			routeSegments.push( { 
				start: value.startStation.getPath(),
				end: value.endStation.getPath()
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

			segmentInfo.startStation.linkedSegments.forEach( _setAdjacentSegments );
			segmentInfo.endStation.linkedSegments.forEach( _setAdjacentSegments );

		}

	}

	return;

	function _setAdjacentSegments( segment ) {

		if ( ! route.has( segment ) ) self.adjacentSegments.add( segment );

	}

}

Routes.prototype.inCurrentRoute = function ( index ) {

	return this.currentRoute.has( this.segments[ index / 2 ] );

}

Routes.prototype.adjacentToRoute = function ( index ) {

	return this.adjacentSegments.has( this.segments[ index / 2 ] );

}

export { Routes };

