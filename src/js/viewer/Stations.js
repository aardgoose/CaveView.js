import {
	BufferGeometry,
	Points,
	Float32BufferAttribute
} from '../../../../three.js/src/Three';

import { ExtendedPointsMaterial } from '../materials/ExtendedPointsMaterial';

import { FEATURE_STATIONS, STATION_ENTRANCE } from '../core/constants';
import { Viewer } from '../viewer/Viewer';
import { ColourCache } from '../core/ColourCache';

function Stations () {

	Points.call( this, new BufferGeometry, new ExtendedPointsMaterial() );

	this.type = 'CV.Stations';
	this.map = new Map();
	this.stationCount = 0;

	this.baseColor     = ColourCache.red;
	this.junctionColor = ColourCache.yellow;

	this.layers.set( FEATURE_STATIONS );

	this.pointSizes = [];
	this.vertices   = [];
	this.colors     = [];

	this.stations = [];

	this.selected = null;
	this.selectedSize = 0;

	var viewState = Viewer.getState;
	var self = this;

	viewState.addEventListener( 'change', _viewChanged );

	this.addEventListener( 'removed', _removed );

	function _viewChanged( event ) {

		if ( event.name === 'splays' ) {

			var splaySize = viewState.splays ? 1.0 : 0.0;

			var stations = self.stations;
			var pSize = self.geometry.getAttribute( 'pSize' );
			var i;
			var l = stations.length;

			for ( i = 0; i < l; i++ ) {

				if ( stations[ i ].hitCount === 0 ) {

					pSize.setX( i, splaySize );

				}

			}

			pSize.needsUpdate = true;
			Viewer.renderView();

		}

	}


	function _removed ( ) {

		viewState.removeEventListener( 'change', _viewChanged );

	}

}

Stations.prototype = Object.create ( Points.prototype );

Stations.prototype.contructor = Stations;

Stations.prototype.addStation = function ( node ) {

	var point = node.p;

	if ( point === undefined ) return;

	this.vertices.push( point );
	this.colors.push( this.baseColor );
	this.pointSizes.push( point.type === STATION_ENTRANCE ? 8.0 : 0.0 ); 

	this.map.set( point.x.toString() + ':' + point.y.toString() + ':' + point.z.toString(), node );
	this.stations.push( node );

	node.hitCount = 0;
	node.stationVertexIndex = this.stationCount++;
	node.linkedSegments = [];

};

Stations.prototype.getStation = function ( vertex ) {

	return this.map.get( vertex.x.toString() + ':' + vertex.y.toString() + ':' + vertex.z.toString() );

};


Stations.prototype.getStationByIndex = function ( index ) {

	return this.stations[ index ];

};

Stations.prototype.clearSelected = function () {

	if ( this.selected !== null ) {

		var pSize = this.geometry.getAttribute( 'pSize' );

		pSize.setX( this.selected, this.selectedSize );
		pSize.needsUpdate = true;

		this.selected = null;

	}

};

Stations.prototype.selectStation = function ( node ) {

	this.selectStationByIndex( node.stationVertexIndex );

};

Stations.prototype.selectStationByIndex = function ( index ) {

	var pSize = this.geometry.getAttribute( 'pSize' );

	if ( this.selected !== null ) {

		pSize.setX( this.selected, this.selectedSize );

	}

	this.selectedSize = pSize.getX( index );

	pSize.setX( index, this.selectedSize * 2 );

//	pSize.updateRange.offset = index;
//	pSize.updateRange.count  = 1;

	pSize.needsUpdate = true;

	this.selected = index;

};

Stations.prototype.updateStation = function ( vertex ) {

	var	station = this.getStation( vertex );

	if ( station !== undefined ) {

		station.hitCount++;

		if ( station.hitCount > 2 ) {

			this.colors[ station.stationVertexIndex ] = this.junctionColor;
			this.pointSizes[ station.stationVertexIndex ] = 4.0;

		} else if ( station.hitCount > 0 ) {

			this.pointSizes[ station.stationVertexIndex ] = 2.0;

		}

	}

};

Stations.prototype.finalise = function () {

	var bufferGeometry = this.geometry;

	var positions = new Float32BufferAttribute(this.vertices.length * 3, 3 );
	var colors = new Float32BufferAttribute( this.colors.length * 3, 3 );

	bufferGeometry.addAttribute( 'pSize', new Float32BufferAttribute( this.pointSizes, 1 ) );
	bufferGeometry.addAttribute( 'position', positions.copyVector3sArray( this.vertices ) );
	bufferGeometry.addAttribute( 'color', colors.copyColorsArray( this.colors ) );

	this.pointSizes = null;
	this.vertices   = null;
	this.colors     = null;

};

Stations.prototype.setScale = function ( scale ) {

	this.material.uniforms.pScale.value = scale;
	this.material.needsUpdate = true;

};


export { Stations };

