
import { ClusterMarkers } from './ClusterMarkers';
import { STATION_ENTRANCE, FEATURE_ENTRANCES } from '../core/constants';
import { Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, TextureLoader } from '../Three';
import { Cfg } from '../core/lib';

function Entrances ( survey ) {

	ClusterMarkers.call( this, survey.modelLimits, 4 );

	const self = this;
	const surveyTree = survey.surveyTree;
	const entrances = survey.metadata.entrances;
	const vertices = [];
	const stations = [];

	const geometry = new BufferGeometry();
	const material = new PointsMaterial();

	material.map = new TextureLoader().load( Cfg.value( 'home', '' ) + 'images/disc.png' );
	material.opacity = 1.0;
	material.alphaTest = 0.8;
	material.sizeAttenuation = false;
	material.transparent = true;
	material.sizeAttenuation = false;
	material.size = 10;

	const markers = new Points( geometry, material );

	markers.layers.set( FEATURE_ENTRANCES );

	// remove common elements from station names if no alternatives available

	var endNode = surveyTree;

	while ( endNode.children.length === 1 ) endNode = endNode.children [ 0 ];

	// find entrances and add Markers

	surveyTree.traverse( _addEntrance );

	let l = vertices.length;

	if ( l > 0 ) {

		const positions = new Float32BufferAttribute( l * 3, 3 );

		positions.copyVector3sArray( vertices );
		geometry.setAttribute( 'position', positions );

	} else {

		this.visible = false;

	}

	this.markers = markers;
	this.stations = stations;
	this.metadata = survey.metadata;

	this.addStatic( markers );

	return this;

	function _addEntrance( node ) {

		var name;

		if ( node.type !== STATION_ENTRANCE ) return;

		const entranceInfo = entrances[ node.getPath() ];

		if ( entranceInfo !== undefined && entranceInfo.name !== undefined ) {

			name = entranceInfo.name;

		} else if ( node.comment !== undefined ) {

			name = node.comment;

		} else {

			name = node.getPath( endNode );

		}

		vertices.push( node.p );
		stations.push( node );

		if ( name === '-skip' ) return;

		self.addMarker( node, ' ' + name + ' ' );

	}

}

Entrances.prototype = Object.create( ClusterMarkers.prototype );

Entrances.prototype.getStation = function ( index ) {

	const station = this.stations[ index ];
	const stationName = station.getPath();

	return {
		station: station,
		name: stationName,
		info: this.metadata.entrances[ stationName ]
	};

};

Entrances.prototype.setStation = function ( station, info ) {

	const metadata = this.metadata;

	metadata.entrances[ station.getPath() ] = info;

	metadata.saveLocal();

};

Entrances.prototype.intersectLabels = function ( mouse, camera, scale ) {

	var labels = this.labels.filter( _filter ).sort( _sort );

	return ( labels.length === 0 ) ? null : labels[ 0 ];

	function _filter ( label ) {

		return label.intersects( mouse, camera, scale );

	}

	function _sort ( a, b ) {

		return a.depth - b.depth;

	}

};

export { Entrances };
