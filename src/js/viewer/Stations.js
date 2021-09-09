import { BufferGeometry, Points, Float32BufferAttribute, Vector3, Object3D } from '../Three';

import { STATION_ENTRANCE } from '../core/constants';
import { PointIndicator } from './PointIndicator';

const __v = new Vector3();

class Stations extends Points {

	constructor ( ctx, selection ) {

		super( new BufferGeometry, ctx.materials.getExtendedPointsMaterial() );

		this.type = 'CV.Stations';
		this.seen = new Set();
		this.stationCount = 0;

		const cfg = ctx.cfg;

		this.baseColor     = cfg.themeColor( 'stations.default.marker' );
		this.junctionColor = cfg.themeColor( 'stations.junctions.marker' );
		this.entranceColor = cfg.themeColor( 'stations.entrances.marker' );

		this.pointSizes = [];
		this.vertices   = [];
		this.colors     = [];

		this.selected = null;
		this.selectedSize = 0;
		this.selection = selection;
		this.splaysVisible = false;

		const point = new PointIndicator( ctx, 0xff0000 );

		point.visible = false;

		this.addStatic( point );
		this.highlightPoint = point;
	}

	addStation ( node ) {

		const seen = this.seen.has( node );

		if ( seen !== false ) {

			// console.log( 'duplicate', node.getPath(), seen.getPath() );
			return;

		}

		const connections = node.connections;

		this.vertices.push( node );

		let pointSize = 0.0;

		if ( node.type & STATION_ENTRANCE ) {

			this.colors.push( this.entranceColor );

			pointSize = 12.0;

		} else {

			this.colors.push( connections > 2 ? this.junctionColor : this.baseColor );

			pointSize = 8.0;

		}

		this.pointSizes.push( pointSize );

		this.seen.add( node );

		node.stationVertexIndex = this.stationCount++;
		node.linkedSegments = [];
		node.legs = [];

	}

	getStation ( vertex ) {

		return vertex;

	}

	getVisibleStation ( node ) {

		if ( this.selection.contains( node.id ) &&
			( node.connections > 0 || this.splaysVisible )
		) return node;

		if ( node.label !== undefined ) node.label.visible = false;

		return null;

	}

	getStationByIndex ( index ) {

		return this.vertices[ index ];

	}

	clearSelected () {

		if ( this.selected !== null ) {

			const pSize = this.geometry.getAttribute( 'pSize' );

			pSize.setX( this.selected, this.selectedSize );
			pSize.needsUpdate = true;

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

		const pSize = this.geometry.getAttribute( 'pSize' );

		if ( this.selected !== null ) {

			pSize.setX( this.selected, this.selectedSize );

		}

		this.selectedSize = pSize.getX( index );

		pSize.setX( index, this.selectedSize * 2 );
		pSize.needsUpdate = true;

		this.selected = index;

	}

	selectStations ( selection ) {

		const vertices = this.vertices;
		const l = vertices.length;
		const pSize = this.geometry.getAttribute( 'pSize' );
		const splaySize = this.splaysVisible ? 6.0 : 0.0;
		const idSet = selection.getIds();
		const isEmpty = selection.isEmpty();

		for ( let i = 0; i < l; i++ ) {

			const node = vertices[ i ];

			let size = 8;

			if ( isEmpty || idSet.has( node.id ) ) {

				if ( node.type & STATION_ENTRANCE ) {

					size = 12;

				} else if ( node.connections === 0 ) {

					size = splaySize;

				}

				pSize.setX( i, size );

			} else {

				pSize.setX( i, 0 );

				if ( node.label !== undefined ) node.label.visible = false;

			}

		}

		pSize.needsUpdate = true;

	}

	finalise () {

		const bufferGeometry = this.geometry;

		const positions = new Float32BufferAttribute(this.vertices.length * 3, 3 );
		const colors = new Float32BufferAttribute( this.colors.length * 3, 3 );

		bufferGeometry.setAttribute( 'pSize', new Float32BufferAttribute( this.pointSizes, 1 ) );
		bufferGeometry.setAttribute( 'position', positions.copyVector3sArray( this.vertices ) );
		bufferGeometry.setAttribute( 'color', colors.copyColorsArray( this.colors ) );

		bufferGeometry.getAttribute( 'color' ).onUpload( Object3D.onUploadDropBuffer );

		this.pointSizes = null;
		this.colors = null;

	}

	resetDistances () {

		this.vertices.forEach( node => { if ( node ) node.shortestPath = Infinity; } );

	}

	getClosestVisibleStation ( camera, intersects ) {

		const splaysVisible = this.splaysVisible;

		let minD2 = Infinity;
		let closestStation = null;

		intersects.forEach( intersect => {

			const station = this.getStationByIndex( intersect.index );

			// don't select spays unless visible

			if ( ! splaysVisible && station !== null && station.connections === 0 ) return;

			// station in screen NDC
			__v.copy( station ).applyMatrix4( this.matrixWorld ).project( camera );

			__v.sub( intersect.point.project( camera ) );

			const d2 = __v.x * __v.x + __v.y * __v.y;

			// choose closest of potential matches in screen x/y space

			if ( d2 < minD2 ) {

				minD2 = d2;
				closestStation = station;

			}

		} );

		return closestStation;

	}

	setSplaysVisibility ( visible ) {

		this.splaysVisible = visible;
		const splaySize = visible ? 6.0 : 0.0;

		const vertices = this.vertices;
		const pSize = this.geometry.getAttribute( 'pSize' );
		const l = vertices.length;
		const selection = this.selection;

		for ( let i = 0; i < l; i++ ) {

			const node = vertices[ i ];

			if ( node.connections === 0 && ( splaySize === 0 || selection.contains( node.id ) ) ) {

				pSize.setX( i, splaySize );

			}

		}

		pSize.needsUpdate = true;
	}

}

export { Stations };