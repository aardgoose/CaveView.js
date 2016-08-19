
import { FEATURE_ENTRANCES } from '../core/constants.js';
import { EntranceFarPointer } from './EntranceFarPointer.js';
import { EntranceNearPointer} from './EntranceNearPointer.js';
import { Label } from './Label.js';

import { LOD } from '../../../../three.js/src/Three.js';

var Marker = ( function () {

	if ( typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ) {
    	return function Marker () {};
	}

	var labelOffset = 30;

	var farPointerCached;
	var nearPointerCached;

	return function Marker ( text ) {

		LOD.call( this );

		this.type = "CV.Marker";

		if ( farPointerCached === undefined ) farPointerCached = new EntranceFarPointer();

		var farPointer  = farPointerCached.clone();

		farPointer.layers.set( FEATURE_ENTRANCES );


		if ( nearPointerCached === undefined ) nearPointerCached = new EntranceNearPointer();

		var nearPointer = nearPointerCached.clone();

		nearPointer.layers.set( FEATURE_ENTRANCES );


		var label = new Label( text );

		label.position.setZ( labelOffset );
		label.layers.set( FEATURE_ENTRANCES );

		nearPointer.add( label );

		this.name = text;

		this.addLevel( nearPointer,  0 );
		this.addLevel( farPointer,  100 );

		return this;

	}

} () );

Marker.prototype = Object.create( LOD.prototype );

Marker.prototype.constructor = Marker;

Marker.prototype.raycast = function ( raycaster, intersects ) {

	var threshold = 10;
	var object = this;

	var ray = raycaster.ray;
	var position = this.getWorldPosition();
	var rayPointDistanceSq = ray.distanceSqToPoint( position );

	if ( rayPointDistanceSq < threshold ) {

		var intersectPoint = ray.closestPointToPoint( position );
		var distance = ray.origin.distanceTo( intersectPoint );

		if ( distance < raycaster.near || distance > raycaster.far ) return;

		intersects.push( {

			distance: distance,
			distanceToRay: Math.sqrt( rayPointDistanceSq ),
			point: intersectPoint.clone(),
			index: 0,
			face: null,
			object: object

		} );

	}

};

export { Marker };

// EOF