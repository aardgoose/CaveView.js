import { Group, Vector3 } from '../Three';

import { CAMERA_OFFSET, LABEL_STATION, LEG_SPLAY } from '../core/constants';
import { Cfg } from '../core/lib';
import { GlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';

const _tmpVector3 = new Vector3();

function StationLabels ( stations ) {

	Group.call( this );

	this.type = 'CV.StationLabels';
	this.stations = stations;

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
	const splaysVisible = camera.layers.mask & 1 << LEG_SPLAY;
	const points = stations.vertices;

	for ( var i = 0, l = points.length; i < l; i++ ) {

		const position = points[ i ];

		const station = stations.getStation( position );
		const connections = position.connections;

		var label = station.label;

		// only show labels for splay end stations if splays visible

		if ( connections === 0 && ! splaysVisible && label !== undefined) {

			label.visible = false;

		} else {

			// show labels for network vertices at greater distance than intermediate stations
			const visible = ( position.distanceToSquared( cameraPosition ) < ( ( connections < 3 ) ? 5000 : 40000 ) );

			if ( label === undefined ) {

				if ( visible ) this.addLabel( station );

			} else {

				label.visible = visible;

			}

		}

	}

};

StationLabels.prototype.addLabel = function ( station ) {

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

	const label = new GlyphString( station.name, material );

	label.layers.set( LABEL_STATION );
	label.position.copy( position );

	station.label = label;

	this.addStatic( label );

};

export { StationLabels };
