import { Group, Vector3 } from '../Three';

import { CAMERA_OFFSET, LABEL_STATION, LABEL_STATION_COMMENT } from '../core/constants';
import { Cfg } from '../core/lib';
import { GlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';

const _tmpVector3 = new Vector3();

function StationLabels ( stations, commentCount ) {

	Group.call( this );

	this.type = 'CV.StationLabels';
	this.stations = stations;
	this.commentCount = commentCount;

	const atlasSpec = {
		color: Cfg.themeColorCSS( 'stations.default.text' ),
		font: 'normal helvetica,sans-serif'
	};

	this.defaultLabelMaterial = Materials.getGlyphMaterial( atlasSpec, 0 );
	this.splayLabelMaterial = Materials.getGlyphMaterial( atlasSpec, 0 );

	atlasSpec.color = Cfg.themeColorCSS( 'stations.junctions.text' );
	this.junctionLabelMaterial = Materials.getGlyphMaterial( atlasSpec, 0 );

}

StationLabels.prototype = Object.create ( Group.prototype );

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
	const stations = this.stations;
	const points = stations.vertices;
	const l = points.length;

	const showName = ( ( camera.layers.mask & 1 << LABEL_STATION ) !== 0 );
	const showComment = ( ( camera.layers.mask & 1 << LABEL_STATION_COMMENT ) !== 0 );
	const commentRatio = l / this.commentCount;

	for ( var i = 0; i < l; i++ ) {

		const position = points[ i ];

		const station = stations.getVisibleStation( position );

		if ( station !== null ) {

			let label = station.label;

			let d2 = 40000;

			if ( position.connections === 0 ) {

				d2 = 250;

			} else if ( position.connections < 3 ) {

				d2 = 5000;

			}

			// eager display of comments scaled by density of comments in survey
			if ( showComment && station.comment !== undefined ) d2 *= commentRatio;

			// show labels for network vertices at greater distance than intermediate stations
			const visible = ( position.distanceToSquared( cameraPosition ) < d2 );

			let name = '';

			if ( showName ) name += station.name;
			if ( showName && showComment && station.comment !== undefined ) name += ' ';
			if ( showComment && station.comment !== undefined ) name += station.comment;

			if ( label === undefined || label.name !== name ) {

				// remove label with the wrong text
				if ( label !== undefined ) this.remove( label );

				if ( visible ) this.addLabel( station, name );

			} else {

				label.visible = visible;

			}

		}

	}

};

StationLabels.prototype.addLabel = function ( station, name ) {

	var material;

	const position = station.p;
	const connections = position.connections;

	if ( connections === 0 ) {

		material = this.splayLabelMaterial;

	} else if ( connections < 3 ) {

		material = this.defaultLabelMaterial;

	} else {

		material = this.junctionLabelMaterial;

	}

	const label = new GlyphString( name, material );

	label.layers.mask = this.layers.mask;
	label.position.copy( position );

	station.label = label;

	this.addStatic( label );

};

export { StationLabels };
