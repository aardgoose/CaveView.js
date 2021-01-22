import { ClusterMarkers } from './ClusterMarkers';
import { STATION_ENTRANCE, FEATURE_ENTRANCES, FEATURE_ENTRANCE_DOTS } from '../core/constants';
import { Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, IncrementStencilOp } from '../Three';

function Entrances ( ctx, survey ) {

	ClusterMarkers.call( this, ctx, survey.modelLimits, 4 );

	const self = this;
	const surveyTree = survey.surveyTree;
	const entrances = survey.metadata.entrances;
	const vertices = [];
	const stations = [];

	const geometry = new BufferGeometry();

	const material = new PointsMaterial( {
		map: ctx.materials.textureCache.getTexture( 'disc-outlined' ),
		opacity: 1.0,
		alphaTest: 0.8,
		sizeAttenuation: false,
		transparent: true,
		size: Math.max( 10, Math.floor( ctx.container.clientWidth / 100 ) ),
		vertexColors: true
	});

	material.stencilWrite = true;
	material.stencilZPass = IncrementStencilOp;

	ctx.viewer.addEventListener( 'resized', ( e ) => {

		material.size = Math.max( 10, Math.floor( e.width / 100 ) );

	} );

	this.entranceColor = ctx.cfg.themeColor( 'stations.entrances.marker' );

	const markers = new Points( geometry, material );

	markers.layers.set( FEATURE_ENTRANCE_DOTS );

	// remove common elements from station names if no alternatives available

	var endNode = surveyTree;

	while ( endNode.children.length === 1 ) endNode = endNode.children [ 0 ];

	// find entrances and add Markers

	surveyTree.traverse( _addEntrance );

	const l = vertices.length * 3;

	if ( l > 0 ) {

		const positions = new Float32BufferAttribute( l, 3 );
		const colors = new Float32BufferAttribute( l, 3 );

		positions.copyVector3sArray( vertices );

		geometry.setAttribute( 'position', positions );
		geometry.setAttribute( 'color', colors );

	} else {

		this.visible = false;

	}

	this.markers = markers;
	this.stations = stations;
	this.metadata = survey.metadata;

	// set default colors - needs to be after markers property is set
	this.setSelection( null );

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

Entrances.prototype.setSelection = function ( selection ) {

	const colors = this.markers.geometry.getAttribute( 'color' );
	const color = this.entranceColor;

	if ( colors === undefined ) return;

	if ( selection === null || selection.isEmpty() ) {

		const array = colors.array;
		const l = array.length;

		for ( let i = 0; i < l; i += 3 ) {

			color.toArray( array, i );

		}

	} else {

		const idSet = selection.getIds();

		this.stations.forEach( function ( node, i ) {

			if ( idSet.has( node.id ) ) {

				color.toArray( colors, i * 3 );

			} else {

				colors.setXYZ( i, 0.5, 0.5, 0.5 );

			}

		} );

	}

	colors.needsUpdate = true;

};

export { Entrances };