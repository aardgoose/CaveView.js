
import {
	LineBasicMaterial,
	LineSegments,
	Geometry,
	EventDispatcher,
} from '../../../../three.js/src/Three';

function Routes ( metadataSource ) {

	// determine segments between junctions and entrances/passage ends and create mapping array.

	this.metadataSource = metadataSource;
	this.surveyTree = null;
	this.vertexPairToSegment = []; // maps vertex index to segment membership
	this.segmentMap = new Map(); // maps segments of survey between ends of passages and junctions.
	this.segmentToInfo = {};

	this.routes = new Map();
	this.routeNames = [];

	this.currentRoute = new Set();
	this.currentRouteName = null;
	this.adjacentSegments = new Set();

	Object.defineProperty( this, 'setRoute', {
		set: function ( x ) { this.loadRoute( x ); },
		get: function () { return this.currentRouteName; }
	} );

	var routes = metadataSource.getRoutes();
	var routeName;
	var routeNames = this.routeNames;

	for ( routeName in routes ) {

		var route = routes[ routeName ];

		routeNames.push( routeName );
		this.routes.set( routeName, route.segments );

	}

	routeNames.sort();

	this.dispatchEvent( { type: 'changed', name: 'download' } );

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
	var vertexPairToSegment = this.vertexPairToSegment;
	var segmentToInfo = this.segmentToInfo;

	var v1, v2;

	var i, l = legs.length;

	var segmentInfo;

	for ( i = 0; i < l; i = i + 2 ) {

		v1 = legs[ i ];
		v2 = legs[ i + 1 ];

		vertexPairToSegment.push( segment );

		if ( newSegment ) {

			station = stations.getStation( v1 );

			if ( station === undefined ) continue; // possible use of separator in station name.

			segmentInfo = {
				segment: segment,
				startStation: station,
				endStation: null
			};

			station.linkedSegments.push( segment );

			newSegment = false;

		}

		station = stations.getStation( v2 );

		if ( ( station && station.hitCount > 2 ) || ( i + 2 < l && ! v2.equals( legs[ i + 2 ] ) ) ) {

			// we have found a junction or a passage end
			segmentInfo.endStation = station;

			segmentMap.set( segmentInfo.startStation.id + ':' + station.id, segmentInfo );
			segmentToInfo[ segment ] = segmentInfo;

			station.linkedSegments.push( segment );

			segment++;

			newSegment = true;

		}

	}

	if ( ! newSegment ) {

		segmentInfo.endStation = station;

		segmentMap.set( segmentInfo.startStation.id + ':' + station.id, segmentInfo );

		station.linkedSegments.push( segment );

	}

	return this;

};

Routes.prototype.createWireframe = function () {

	var geometry = new Geometry();
	var vertices = geometry.vertices;

	this.segmentMap.forEach( _addSegment );

	return new LineSegments( geometry, new LineBasicMaterial( { color: 0x00ff00 } ) );

	function _addSegment( value /*, key */ ) {

		vertices.push( value.startStation.p );
		vertices.push( value.endStation.p );

	}

};

Routes.prototype.addRoute = function ( routeName ) {

	if ( routeName === this.currentRouteName || routeName === undefined ) return;

	if ( this.routeNames.indexOf( routeName ) < 0 ) {

		// create entry for empty route if a new name

		this.routeNames.push( routeName );
		this.routes.set( routeName, [] );

	}

	this.loadRoute( routeName );

};

Routes.prototype.loadRoute = function ( routeName ) {

	var self = this;

	var surveyTree = this.surveyTree;
	var currentRoute = this.currentRoute;
	var segmentMap = this.segmentMap;

	var map;
	var segment;

	var routeSegments = this.routes.get( routeName );

	if ( ! routeSegments ) {

		alert( 'route ' + routeName + ' does not exist' );
		return false;

	}

	currentRoute.clear();

	for ( var i = 0; i < routeSegments.length; i++ ) {

		segment = routeSegments[ i ];

		map = segmentMap.get( surveyTree.getIdByPath( segment.start.split( '.' ) ) + ':' + surveyTree.getIdByPath( segment.end.split( '.' ) ) );

		if ( map !== undefined ) currentRoute.add( map.segment );

	}

	this.currentRouteName = routeName;

	self.dispatchEvent( { type: 'changed', name: '' } );

	return true;

};

Routes.prototype.getCurrentRoute = function () {

	return this.currentRoute;

};

Routes.prototype.saveCurrent = function () {

	var routeName = this.currentRouteName;

	if ( ! routeName ) return;

	var segmentMap = this.segmentMap;
	var route = this.currentRoute;

	var routeSegments = [];

	segmentMap.forEach( _addRoute );

	// update in memory route

	this.routes.set( routeName, routeSegments );

	// update persistant browser storage

	this.metadataSource.saveRoute( routeName, { segments: routeSegments } );

	function _addRoute ( value /*, key */ ) {

		if ( route.has( value.segment ) ) {

			routeSegments.push( {
				start: value.startStation.getPath(),
				end: value.endStation.getPath()
			} );

		}

	}

};

Routes.prototype.getRouteNames = function () {

	return this.routeNames;

};

Routes.prototype.toggleSegment = function ( index ) {

	var self = this;
	var route = this.currentRoute;
	var segment = this.vertexPairToSegment[ index / 2 ];

	this.adjacentSegments.clear();

	if ( route.has( segment ) ) {

		route.delete( segment );

	} else {

		route.add( segment );

		// handle adjacent segments to the latest segment toggled 'on'

		var segmentInfo = this.segmentToInfo[ segment ];

		if ( segmentInfo !== undefined ) {

			segmentInfo.startStation.linkedSegments.forEach( _setAdjacentSegments );
			segmentInfo.endStation.linkedSegments.forEach( _setAdjacentSegments );

		}

	}

	return;

	function _setAdjacentSegments ( segment ) {

		if ( ! route.has( segment ) ) self.adjacentSegments.add( segment );

	}

};

Routes.prototype.inCurrentRoute = function ( index ) {

	return this.currentRoute.has( this.vertexPairToSegment[ index / 2 ] );

};

Routes.prototype.adjacentToRoute = function ( index ) {

	return this.adjacentSegments.has( this.vertexPairToSegment[ index / 2 ] );

};

export { Routes };

