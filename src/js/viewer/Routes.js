
import { EventDispatcher } from '../Three';

function Routes ( survey ) {

	// determine segments between junctions and entrances/passage ends and create mapping array.

	this.metadata = survey.metadata;
	this.topology = survey.topology;
	this.surveyTree = survey.surveyTree;

	this.routes = new Map();
	this.routeNames = [];

	this.currentRoute = new Set();
	this.currentRouteName = null;
	this.adjacentSegments = new Set();

	Object.defineProperty( this, 'setRoute', {
		set: function ( x ) { this.loadRoute( x ); },
		get: function () { return this.currentRouteName; }
	} );

	const routes = this.metadata.getRoutes();
	const routeNames = this.routeNames;

	var routeName;

	for ( routeName in routes ) {

		const route = routes[ routeName ];

		routeNames.push( routeName );
		this.routes.set( routeName, route.segments );

	}

	routeNames.sort();

	this.dispatchEvent( { type: 'changed', name: 'download' } );

}

Object.assign( Routes.prototype, EventDispatcher.prototype );

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

	const self = this;

	const surveyTree = this.surveyTree;
	const currentRoute = this.currentRoute;
	const segmentMap = this.topology.segmentMap;
	const routeSegments = this.routes.get( routeName );

	var i;

	if ( ! routeSegments ) {

		alert( 'route ' + routeName + ' does not exist' );
		return false;

	}

	currentRoute.clear();

	for ( i = 0; i < routeSegments.length; i++ ) {

		const segment = routeSegments[ i ];

		const map = segmentMap.get( surveyTree.getIdByPath( segment.start ) + ':' + surveyTree.getIdByPath( segment.end ) );

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

	const routeName = this.currentRouteName;
	const segmentMap = this.topology.segmentMap;
	const route = this.currentRoute;

	if ( ! routeName ) return;

	const routeSegments = [];

	segmentMap.forEach( _addRoute );

	// update in memory route

	this.routes.set( routeName, routeSegments );

	// update persistant browser storage

	this.metadata.saveRoute( routeName, { segments: routeSegments } );

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

	const self = this;
	const route = this.currentRoute;
	const segment = this.topology.vertexSegment( index );

	this.adjacentSegments.clear();

	if ( route.has( segment ) ) {

		route.delete( segment );

	} else {

		route.add( segment );

		// handle adjacent segments to the latest segment toggled 'on'

		const segmentInfo = this.topology.segmentToInfo[ segment ];

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

	return this.currentRoute.has( this.topology.vertexSegment( index ) );

};

Routes.prototype.adjacentToRoute = function ( index ) {

	return this.adjacentSegments.has( this.topology.vertexSegment( index ) );

};


export { Routes };
