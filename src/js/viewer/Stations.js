import { Mesh, Matrix4, Vector3, Vector4 } from '../Three';

import { STATION_ENTRANCE } from '../core/constants';
import { PointIndicator } from './PointIndicator';
import { ExtendedPointsMaterial } from '../nodeMaterials/ExtendedPointsMaterial';
import { InstancedSpriteGeometry } from '../core/InstancedSpriteGeometry';

const _position = new Vector4();
const _ssOrigin = new Vector4();
const _mouse = new Vector3();
const _mvMatrix = new Matrix4();

class Stations extends Mesh {

	constructor ( survey ) {

		const ctx = survey.ctx;

		super( new InstancedSpriteGeometry(), new ExtendedPointsMaterial( ctx ) );

		this.type = 'CV:Stations';
		this.stationCount = 0;
		this.ctx = ctx;

		const cfg = ctx.cfg;

		this.baseColor     = cfg.themeColor( 'stations.default.marker' );
		this.junctionColor = cfg.themeColor( 'stations.junctions.marker' );
		this.entranceColor = cfg.themeColor( 'stations.entrances.marker' );

		this.vertices = [];
		this.colors = [];
		this.sizes = [];

		this.survey = survey;
		this.selected = null;
		this.selectedSize = 0;
		this.selection = survey.selection;
		this.splaysVisible = false;
		this.ssThresholdSq = Math.pow( cfg.value( 'stationSelectionDistance', 12 ), 2 );

		const point = new PointIndicator( ctx, 0xff0000 );

		point.visible = false;

		this.addStatic( point );
		this.highlightPoint = point;

	}

	raycast( raycaster, intersects ) {
		// FIXME -
		// screen space raycasing for stations

		if ( ! this.visible ) return intersects;

		const matrixWorld = this.matrixWorld;
		const ray = raycaster.ray;

		// test against survey section bounding boxes

		const surveyTree = this.survey.surveyTree;
		const searchNodes = surveyTree.findIntersects( matrixWorld, ray );

		const camera = raycaster.camera;
		const projectionMatrix = camera.projectionMatrix;
		const skipSplays = ! this.splaysVisible;
		const near = - camera.near;

		ray.at( 1, _ssOrigin );

		// ndc space [ - 1.0, 1.0 ]
		const container = this.ctx.container;

		const scale = new Vector3( container.clientWidth / 2, container.clientHeight / 2, 1 );

		_ssOrigin.w = 1;

		_ssOrigin.applyMatrix4( camera.matrixWorldInverse );
		_ssOrigin.applyMatrix4( camera.projectionMatrix );
		_ssOrigin.multiplyScalar( 1 / _ssOrigin.w );

		// screen space
		_mouse.copy( _ssOrigin );
		_mouse.multiply( scale );

		_mvMatrix.multiplyMatrices( camera.matrixWorldInverse, matrixWorld );

		const ssThresholdSq = this.ssThresholdSq;

		for ( const node of searchNodes ) {

			const vertices = node.children;

			for ( let i = 0, l = vertices.length; i < l; i ++ ) {

				const station = vertices[ i ];

				// skip splay end stations if not visible
				if ( skipSplays && station.connections === 0 && station.type === 1 ) continue;

				_position.copy( station );
				_position.w = 1;

				_position.applyMatrix4( _mvMatrix );

				if ( _position.z > near ) {

					continue;

				}

				_position.applyMatrix4( projectionMatrix );
				_position.multiplyScalar( 1 / _position.w );

				_position.x *= scale.x;
				_position.y *= scale.y;

				testPoint( _position, station, i, ssThresholdSq, intersects, this );

			}

		}

	}

	count () {

		return this.vertices.length;

	}

	addStation ( node ) {

		if ( node.stationVertexIndex != -1 ) return; // duplicated entry

		let size = 0.0;
		let color;

		if ( node.type & STATION_ENTRANCE ) {

			color = this.entranceColor;
			size = 12.0;

		} else {

			color = node.effectiveConnections() > 2 ? this.junctionColor : this.baseColor;
			size = 8.0;

		}

		this.vertices.push( node );
		this.colors.push( color );
		this.sizes.push( size );

		node.stationVertexIndex = this.stationCount++;

	}

	isStationVisible ( node ) {

		return ( this.selection.contains( node.parent.id ) &&
			( node.connections > 0 || this.splaysVisible )
		);

	}

	getStationByIndex ( index ) {

		return this.vertices[ index ];

	}

	clearSelected () {

		if ( this.selected !== null ) {

			this.geometry.setPointSize( this.selected, this.selectedSize );
			this.selected = null;

		}

	}

	highlightStation ( node ) {

		const highlightPoint = this.highlightPoint;

		highlightPoint.position.copy( node );
		highlightPoint.updateMatrix();

		highlightPoint.visible = true;

		return node;

	}

	clearHighlight () {

		this.highlightPoint.visible = false;

	}

	selectStation ( node ) {

		this.selectStationByIndex( node.stationVertexIndex );

	}

	selectStationByIndex ( index ) {

		this.clearSelected();

		this.selectedSize = this.geometry.getPointSize( index );

		this.geometry.setPointSize( index, this.selectedSize * 2 );

		this.selected = index;

	}

	selectStations ( selection ) {

		const vertices = this.vertices;
		const l = vertices.length;
		const splaySize = this.splaysVisible ? 6.0 : 0.0;
		const idSet = selection.getIds();
		const isEmpty = selection.isEmpty();

		const geometry = this.geometry;

		for ( let i = 0; i < l; i++ ) {

			const node = vertices[ i ];

			let size = 8;

			if ( isEmpty || idSet.has( node.parent.id ) ) {

				if ( node.type & STATION_ENTRANCE ) {

					size = 12;

				} else if ( node.connections === 0 ) {

					size = splaySize;

				}

				geometry.setPointSize( i, size );

			} else {

				geometry.setPointSize( i, 0 );

				if ( node.label !== undefined ) node.label.visible = false;

			}

		}

	}

	finalise () {

		this.geometry.setPositions( this.vertices );
		this.geometry.setColors( this.colors );
		this.geometry.setSizes( this.sizes );

		this.sizes = null;
		this.points = null;

	}

	setSplaysVisibility ( visible ) {

		this.splaysVisible = visible;
		const splaySize = visible ? 6.0 : 0.0;

		const vertices = this.vertices;
		const l = vertices.length;
		const selection = this.selection;
		const geometry = this.geometry;

		for ( let i = 0; i < l; i++ ) {

			const node = vertices[ i ];

			if ( node.connections === 0 && ( splaySize === 0 || selection.contains( node.id ) ) ) {

				geometry.setPointSize( i, splaySize );

			}

		}

	}

	resetPaths () {

		this.vertices.forEach( node => node.shortestPath = Infinity );

	}

	forEach ( callback ) {

		this.vertices.forEach( station => {

			if ( station.connections !== 0 ) callback( station );

		} );

	}

}

function testPoint( point, station, index, localThresholdSq, intersects, object ) {

	const dX = point.x - _mouse.x;
	const dY = point.y - _mouse.y;

	const distanceSq = dX * dX + dY * dY;

	if ( distanceSq < localThresholdSq ) {

		intersects.push( {
			distance: Math.sqrt( distanceSq ),
			point: point,
			index: index,
			station: station,
			face: null,
			object: object
		} );

	}

}

export { Stations };