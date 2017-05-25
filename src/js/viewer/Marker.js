
import { FEATURE_ENTRANCES } from '../core/constants';
import { EntranceFarPointer } from './EntranceFarPointer';
import { EntranceNearPointer} from './EntranceNearPointer';
import { Label } from './Label';
import { GlyphAtlas } from './GlyphAtlas';
import { GlyphString } from './GlyphString';

import { LOD } from '../../../../three.js/src/Three';

var labelOffset = 30;
var nearPointerCached;
var glyphAtlas = new GlyphAtlas();

function Marker ( survey, entrance ) {

	LOD.call( this );

	this.type = 'CV.Marker';

	var text = entrance.label;

	var farPointer = new EntranceFarPointer( survey, entrance.position );

	farPointer.layers.set( FEATURE_ENTRANCES );

	if ( nearPointerCached === undefined ) nearPointerCached = new EntranceNearPointer();

	var nearPointer = nearPointerCached.clone();

	nearPointer.layers.set( FEATURE_ENTRANCES );

/*
	var label = new Label( text );
*/

	var label = new GlyphString( text, glyphAtlas );

	label.position.setZ( labelOffset );
	label.layers.set( FEATURE_ENTRANCES );

	nearPointer.add( label );

	this.name = text;

	this.addLevel( nearPointer, 0 );
	this.addLevel( farPointer, 100 );

	this.position.copy( entrance.position );

	this.addEventListener( 'removed', this.onRemove );

	return this;

}


Marker.prototype = Object.create( LOD.prototype );

Marker.prototype.constructor = Marker;

Marker.prototype.onRemove = function ( /* event */ ) {

	var levels = this.levels;

	for ( var i = 0, l = levels.length; i < l; i++ ) {

		levels[ i ].object.dispatchEvent( { type: 'removed' } );

	}

};

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