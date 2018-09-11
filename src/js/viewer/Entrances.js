
import { ClusterMarkers } from './ClusterMarkers';
import { STATION_ENTRANCE } from '../core/constants';
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

	// remove common elements from station names if no alternatives available

	var endNode = surveyTree;

	while ( endNode.children.length === 1 ) endNode = endNode.children [ 0 ];

	// find entrances and add Markers

	surveyTree.traverse( _addEntrance );

	let l = vertices.length;

	if ( l > 0 ) {

		const positions = new Float32BufferAttribute( l * 3, 3 );

		positions.copyVector3sArray( vertices );
		geometry.addAttribute( 'position', positions );

	}

	this.markers = markers;
	this.stations = stations;

	this.addStatic( markers );

	return this;

	function _addEntrance( node ) {

		if ( node.type !== STATION_ENTRANCE ) return;

		const entranceInfo = entrances[ node.getPath() ];
		const name = ( entranceInfo !== undefined && entranceInfo.name !== undefined ) ? entranceInfo.name : node.getPath( endNode );

		vertices.push( node.p );
		stations.push( node );

		if ( name === '-skip' ) return;

		self.addMarker( node, ' ' + name + ' ' );

	}

}

Entrances.prototype = Object.create( ClusterMarkers.prototype );

Entrances.prototype.getStation = function ( index ) {

	return this.stations[ index ];

};

export { Entrances };
