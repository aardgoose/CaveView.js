import { EventDispatcher } from '../Three';
import { LEG_CAVE } from '../core/constants';

class Routes extends EventDispatcher {

	constructor ( survey ) {

		super();

		// determine segments between junctions and entrances/passage ends and create mapping array.

		this.metadata = survey.metadata;
		this.segments = survey.segments;
		this.legs = survey.features.get( LEG_CAVE );
		this.surveyTree = survey.surveyTree;

		this.routes = new Map();
		this.routeNames = [];

		this.currentRoute = new Set();
		this.currentRouteName = null;
		this.adjacentSegments = new Set();

		Object.defineProperty( this, 'setRoute', {
			set( x ) { this.loadRoute( x ); },
			get() { return this.currentRouteName; }
		} );

		const routes = this.metadata.getRoutes();
		const routeNames = this.routeNames;

		let routeName;

		for ( routeName in routes ) {

			const route = routes[ routeName ];

			routeNames.push( routeName );
			this.routes.set( routeName, route.segments );

		}

		routeNames.sort();

		this.dispatchEvent( { type: 'changed', name: 'download' } );

	}

	addRoute ( routeName ) {

		if ( routeName === this.currentRouteName || routeName === undefined ) return;

		if ( this.routeNames.indexOf( routeName ) < 0 ) {

			// create entry for empty route if a new name

			this.routeNames.push( routeName );
			this.routes.set( routeName, [] );

		}

		this.loadRoute( routeName );

	}

	loadRoute ( routeName ) {

		const self = this;

		const surveyTree = this.surveyTree;
		const currentRoute = this.currentRoute;
		const segmentMap = this.segments.getMap();
		const routeSegments = this.routes.get( routeName );

		if ( ! routeSegments ) {

			alert( 'route ' + routeName + ' does not exist' );
			return false;

		}

		currentRoute.clear();

		for ( let i = 0; i < routeSegments.length; i++ ) {

			const segment = routeSegments[ i ];

			const map = segmentMap.get( surveyTree.getIdByPath( segment.start ) + ':' + surveyTree.getIdByPath( segment.end ) );

			if ( map !== undefined ) currentRoute.add( map.segment );

		}

		this.currentRouteName = routeName;

		self.dispatchEvent( { type: 'changed', name: '' } );

		return true;

	}

	getCurrentRoute () {

		return this.currentRoute;

	}

	saveCurrent () {

		const routeName = this.currentRouteName;
		const segmentMap = this.segments.getMap();
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

	}

	getRouteNames () {

		return this.routeNames;

	}

	toggleSegment ( index ) {

		const self = this;
		const route = this.currentRoute;
		const segment = this.legs.vertexSegment( index );

		this.adjacentSegments.clear();

		if ( route.has( segment ) ) {

			route.delete( segment );

		} else {

			route.add( segment );

			// handle adjacent segments to the latest segment toggled 'on'

			const segmentInfo = this.segments.getSegmentInfo( segment );

			if ( segmentInfo !== undefined ) {

				segmentInfo.startStation.linkedSegments.forEach( _setAdjacentSegments );
				segmentInfo.endStation.linkedSegments.forEach( _setAdjacentSegments );

			}

		}

		return;

		function _setAdjacentSegments ( segment ) {

			if ( ! route.has( segment ) ) self.adjacentSegments.add( segment );

		}

	}

	inCurrentRoute ( segment ) {

		return this.currentRoute.has( segment );

	}

	adjacentToRoute ( segment ) {

		return this.adjacentSegments.has( segment );

	}

}

export { Routes };