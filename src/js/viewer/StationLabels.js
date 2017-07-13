import { Group, Vector3 } from '../../../../three.js/src/Three';

import { CAMERA_OFFSET, LABEL_STATION, LEG_SPLAY } from '../core/constants';
import { ColourCache } from '../core/ColourCache';
import { GlyphString } from '../viewer/GlyphString';
import { Materials } from '../materials/Materials';

var _tmpVector3 = new Vector3();

function StationLabels () {

	Group.call( this );

	this.type = 'CV.StationLabels';
	this.layers.set( LABEL_STATION );

	this.labelMaterial = Materials.getGlyphMaterial( 'normal helvetica,sans-serif', 0 );

}

StationLabels.prototype = Object.create ( Group.prototype );

StationLabels.prototype.constructor = StationLabels;

StationLabels.prototype.addStation = function ( station ) {

	var label = new GlyphString( station.name, this.labelMaterial );

	label.layers.set( LABEL_STATION );

	label.position.copy( station.p );

	label.hitCount = station.hitCount;
	label.visible = false;

	this.add( label );

};

StationLabels.prototype.update = function ( camera, target, inverseWorld ) {

	var cameraPosition = _tmpVector3.copy( camera.position );

	if ( camera.isOrthographicCamera ) {

		// if orthographic, calculate 'virtual' camera position

		cameraPosition.sub( target ); // now vector from target

		cameraPosition.setLength( CAMERA_OFFSET / camera.zoom ); // scale for zoom factor
		cameraPosition.add( target ); // relocate in world space

	}

	// transform camera position into model coordinate system

	cameraPosition.applyMatrix4( inverseWorld );

	var label, limit;
	var splaysVisible = camera.layers.mask & 1 << LEG_SPLAY;
	var children = this.children;

	for ( var i = 0, l = children.length; i < l; i++ ) {

		label = children[ i ];

		// only show labels for splay end stations if splays visible
		if ( label.hitCount === 0 && ! splaysVisible ) {

			label.visible = false;

		} else {

			// show labels for network vertices at greater distance than intermediate stations
			limit = ( label.hitCount < 3 ) ? 10000 : 20000;
			label.visible =  ( label.position.distanceToSquared( cameraPosition) < limit );

		}

	}

};

export { StationLabels };

