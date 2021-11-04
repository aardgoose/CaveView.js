import { Group, Vector3 } from '../Three';

import { CAMERA_OFFSET, LABEL_STATION, LABEL_STATION_COMMENT } from '../core/constants';
import { GlyphString } from '../core/GlyphString';

const _tmpVector3 = new Vector3();

class StationLabels extends Group {

	constructor ( ctx, stations, commentCount ) {

		super();

		this.type = 'CV.StationLabels';
		this.stations = stations;
		this.commentCount = commentCount;
		this.ctx = ctx;

		const cfg = ctx.cfg;
		const materials = ctx.materials;

		const atlasSpecDefault = {
			color: cfg.themeColorCSS( 'stations.default.text' ),
			font: cfg.themeValue( 'stations.font' )
		};

		this.defaultLabelMaterial = materials.getGlyphMaterial( atlasSpecDefault, 0 );
		this.splayLabelMaterial = materials.getGlyphMaterial( atlasSpecDefault, 0 );

		const atlasSpecJunction = {
			color: cfg.themeColorCSS( 'stations.junctions.text' ),
			font: cfg.themeValue( 'stations.font' )
		};

		this.junctionLabelMaterial = materials.getGlyphMaterial( atlasSpecJunction, 0 );

	}

	update ( camera, target, inverseWorld ) {

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

		for ( let i = 0; i < l; i++ ) {

			const station = points[ i ];
			const label = station.label;

			if ( ! stations.isStationVisible( station ) ) {

				if ( label ) label.visible = false;
				continue;

			}

			const connections = station.effectiveConnections();
			let d2 = 40000;

			if ( connections === 0 ) {

				d2 = 250;

			} else if ( connections < 3 ) {

				d2 = 5000;

			}

			// eager display of comments scaled by density of comments in survey
			if ( showComment && station.comment !== undefined ) d2 *= commentRatio;

			// show labels for network vertices at greater distance than intermediate stations
			const visible = ( station.distanceToSquared( cameraPosition ) < d2 );

			if ( visible ) {

				let name = '';

				if ( showName ) name += station.name;
				if ( showName && showComment && station.comment !== undefined ) name += ' ';
				if ( showComment && station.comment !== undefined ) name += station.comment;

				if ( label && label.name !== name ) {

					// remove label with the wrong text
					this.remove( label );
					station.label = null;

				}

				if ( ! station.label  ) {

					this.addLabel( station, name, connections );

				}

				station.label.visible = true;

			} else {

				if ( label ) label.visible = false;

			}

		}

	}

	addLabel ( station, name, connections ) {

		let yOffset = 0;

		// handle labels for duplicate stations
		if ( station.next !== null ) {

			// ofset one label upwards
			yOffset = ( station.id > station.next.id ) ? 1.2 : 0;

		}

		let material;

		if ( connections === 0 ) {

			material = this.splayLabelMaterial;

		} else if ( connections < 3 ) {

			material = this.defaultLabelMaterial;

		} else {

			material = this.junctionLabelMaterial;

		}

		const label = new GlyphString( name, material, this.ctx, yOffset * material.getCellSize() );

		label.layers.mask = this.layers.mask;
		label.position.copy( station );

		station.label = label;

		this.addStatic( label );

	}

}

export { StationLabels };