import { Group, Vector3 } from '../Three';

import { CAMERA_OFFSET, LABEL_STATION, LEG_SPLAY } from '../core/constants';
import { GlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';

const _tmpVector3 = new Vector3();

/*

lightweight fake Object3D.

*/

function DummyStationLabel( station ) {

	this.position = station.p;
	this.station = station;

}

// minimum parts of Object3D to be compatible with three.js and this code.

DummyStationLabel.prototype.visible = false;
DummyStationLabel.prototype.isObject3D = true;
DummyStationLabel.prototype.parent = null;
DummyStationLabel.prototype.dispatchEvent = function () {};
DummyStationLabel.prototype.updateMatrixWorld = function () {};
DummyStationLabel.prototype.traverse = function () {};

function StationLabels () {

	Group.call( this );

	this.type = 'CV.StationLabels';
	this.layers.set( LABEL_STATION );

	var atlasSpec = {
		color: '#ffffff',
		background: '#000000',
		font: 'normal helvetica,sans-serif'
	};

	this.defaultLabelMaterial = Materials.getGlyphMaterial( atlasSpec, 0 );
	this.splayLabelMaterial = Materials.getGlyphMaterial( atlasSpec, 0 );

	atlasSpec.color = '#ffff00';
	this.junctionLabelMaterial = Materials.getGlyphMaterial( atlasSpec, 0 );

}

StationLabels.prototype = Object.create ( Group.prototype );

StationLabels.prototype.constructor = StationLabels;

StationLabels.prototype.addStation = function ( station ) {

	this.add( new DummyStationLabel( station ) );

};

StationLabels.prototype.update = function ( camera, target, inverseWorld ) {

	const cameraPosition = _tmpVector3.copy( camera.position );

	if ( camera.isOrthographicCamera ) {

		// if orthographic, calculate 'virtual' camera position

		cameraPosition.sub( target ); // now vector from target

		cameraPosition.setLength( CAMERA_OFFSET / camera.zoom ); // scale for zoom factor
		cameraPosition.add( target ); // relocate in world space

	}

	// transform camera position into model coordinate system

	cameraPosition.applyMatrix4( inverseWorld );

	const splaysVisible = camera.layers.mask & 1 << LEG_SPLAY;
	const children = this.children;

	for ( var i = 0, l = children.length; i < l; i++ ) {

		const label = children[ i ];
		const hitCount = label.station.hitCount;

		// only show labels for splay end stations if splays visible

		if ( hitCount === 0 && ! splaysVisible ) {

			label.visible = false;

		} else {

			// show labels for network vertices at greater distance than intermediate stations
			label.visible = ( label.position.distanceToSquared( cameraPosition ) < ( ( hitCount < 3 ) ? 5000 : 40000 ) );

			if ( label.visible && ! label.isGlyphString ) {

				// lazy creation of GlyphStrings

				this.createLabel( label );

			}

		}

	}

};

StationLabels.prototype.createLabel = function ( dummyLabel ) {

	const station = dummyLabel.station;
	var material;

	if ( station.hitCount === 0 ) {

		material = this.splayLabelMaterial;

	} else if ( station.hitCount < 3 ) {

		material = this.defaultLabelMaterial;

	} else {

		material = this.junctionLabelMaterial;

	}

	const label = new GlyphString( station.name, material );

	label.layers.set( LABEL_STATION );
	label.position.copy( station.p );
	label.visible = false;
	label.station = station;

	this.remove( dummyLabel );
	this.add( label );

};

export { StationLabels };

