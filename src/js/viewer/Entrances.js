import { Mesh, Color } from '../Three';
import { ClusterMarkers } from './ClusterMarkers';
import { STATION_ENTRANCE, FEATURE_ENTRANCE_DOTS } from '../core/constants';
import { InstancedSpriteGeometry } from '../core/InstancedSpriteGeometry';
import { InstancedSpriteMaterial } from '../nodeMaterials/InstancedSpriteMaterial';

class Entrances extends ClusterMarkers {

	constructor ( ctx, survey ) {

		super( ctx, survey.modelLimits, 4 );

		const self = this;
		const surveyTree = survey.surveyTree;
		const entrances = survey.metadata.entrances;
		const vertices = [];

		const geometry = new InstancedSpriteGeometry();

		this.entranceColor = ctx.cfg.themeColor( 'stations.entrances.marker' );

		const markers = new Mesh( geometry, ctx.materials.getMaterial( InstancedSpriteMaterial ) );

		markers.layers.set( FEATURE_ENTRANCE_DOTS );

		// remove common elements from station names if no alternatives available

		let endNode = surveyTree;

		while ( endNode.children.length === 1 ) endNode = endNode.children [ 0 ];

		// find entrances and add Markers

		surveyTree.traverse( _addEntrance );

		const l = vertices.length * 3;

		if ( l > 0 ) {

			geometry.setPositions( vertices );

		} else {

			this.visible = false;

		}

		this.markers = markers;
		this.vertices = vertices;
		this.metadata = survey.metadata;

		// set default colors - needs to be after markers property is set
		this.setSelection( null );

		this.addStatic( markers );

		return this;

		function _addEntrance ( node ) {

			if ( ! ( ( node.ownType ?? node.type ) & STATION_ENTRANCE ) ) return;

			if ( node.next ) {

				let next = node.next;

				// skip labels for all expect lowest id station
				while ( next !== node ) {

					if ( ( next.ownType & STATION_ENTRANCE ) !== 0 && Math.abs( node.id ) > Math.abs( next.id ) ) return;
					next = next.next;

				}

			}

			vertices.push( node );

			let name;

			const entranceInfo = entrances[ node.getPath() ];

			if ( entranceInfo?.name !== undefined ) {

				name = entranceInfo.name;
				if ( name === '-skip' ) return;

			} else if ( node.comment !== undefined ) {

				name = node.comment;

			} else {

				name = node.getPath( endNode );

			}

			self.addMarker( node, ` ${name} ` );

		}

	}

	count () {

		return this.vertices.length;

	}

	getStation ( index ) {

		const station = this.vertices[ index ];
		const stationName = station.getPath();

		return {
			station: station,
			name: stationName,
			info: this.metadata.entrances[ stationName ]
		};

	}

	setStation ( station, info ) {

		const metadata = this.metadata;

		metadata.entrances[ station.getPath() ] = info;

		metadata.saveLocal();

	}

	setSelection ( selection ) {

		if ( ! this.visible ) return; // no entrances in survey

		const color = this.entranceColor;

		const geometry = this.markers.geometry;

		if ( selection === null || selection.isEmpty() ) {

			geometry.setAllPointColors( color );

		} else {

			const idSet = selection.getIds();

			this.vertices.forEach( function ( node, i ) {

				if ( idSet.has( node.parent.id ) ) {

					geometry.setPointColor( i, color );

				} else {

					geometry.setPointColor( i, Color( 0.5, 0.5, 0.5 ) );

				}

			} );

		}

	}

	forEachEntrance ( callback ) {

		this.vertices.forEach( e => {

			callback( e );

			let next = e.next;

			while ( next !== null && next !== e ) {

				callback( next );
				next = next.next;

			}

		} );

	}

}

export { Entrances };