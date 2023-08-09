import { InstancedBufferGeometry, InstancedBufferAttribute, Sphere, Box3, Vector3 } from 'three';
import { CommonAttributes } from './CommonAttributes.js';

const _vector = new Vector3();

class InstancedSpriteGeometry extends InstancedBufferGeometry {

	constructor () {

		super();

		this.setIndex( CommonAttributes.index );
		this.setAttribute( 'position', CommonAttributes.position );
		this.setAttribute( 'uv', CommonAttributes.uv );

	}

	setPositions ( positions ) {

		const instanceCount = positions.length;

		const buffer = new Float32Array( instanceCount * 3 );
		const instancePosition = new InstancedBufferAttribute( buffer, 3, false, 1 );

		for ( let i = 0; i < instanceCount; i++ ) {

			const v = positions[ i ];
			instancePosition.setXYZ( i, v.x, v.y, v.z );

		}

		this.setAttribute( 'instancePosition', instancePosition );

		this.instanceCount = instanceCount;

		this.computeBoundingSphere();

	}

	setColors ( colors ) {

		const count = colors.length;

		if ( count !== this.instanceCount ) throw 'invalid color count';

		const buffer = new Float32Array( count * 3 );
		const instanceColor = new InstancedBufferAttribute( buffer, 3, false, 1 );

		for ( let i = 0; i < count; i++ ) {

			const v = colors[ i ];
			instanceColor.setXYZ( i, v.r, v.g, v.b );

		}

		this.setAttribute( 'instanceColor', instanceColor );

	}

	setSizes ( sizes ) {

		const count = sizes.length;

		if ( count !== this.instanceCount ) throw 'invalid size count';

		const buffer = new Float32Array( count );
		const instanceSize = new InstancedBufferAttribute( buffer, 1, false, 1 );

		for ( let i = 0; i < count; i++ ) {

			instanceSize.setX( i, sizes[ i ] );

		}

		this.setAttribute( 'instanceSize', instanceSize );

	}

	setPointSize( index, size ) {

		const instanceSize = this.getAttribute( 'instanceSize' );

		instanceSize.setX( index, size );
		instanceSize.needsUpdate = true;

	}

	getPointSize( index ) {

		const instanceSize = this.getAttribute( 'instanceSize' );

		return instanceSize.getX( index );

	}

	getPointColor( index, color ) {

		const instanceColor = this.getAttribute( 'instanceColor' );

		instanceColor.setXYZ( index, color.r, color.g, color.b );
		instanceColor.needsUpdate = true;

	}

	setAllPointColors ( color ) {

		let instanceColor = this.getAttribute( 'instanceColor' );
		let buffer;

		if ( ! instanceColor ) {

			buffer = new Float32Array( this.instantCount * 3 );
			instanceColor = new InstancedBufferAttribute( buffer, 3, false, 1 );

		} else {

			buffer = instanceColor.array;

		}

		const l = buffer.length;

		for ( let i = 0; i < l; i += 3 ) {

			color.toArray( buffer, i );

		}

		instanceColor.needsUpdate = true;

	}

	computeBoundingBox () {

		if ( this.boundingBox === null ) {

			this.boundingBox = new Box3();

		}

		const position = this.attributes.instancePosition;

		if ( position !== undefined ) {

			this.boundingBox.setFromBufferAttribute( position );

		}


	}

	computeBoundingSphere () {

		if ( this.boundingSphere === null ) {

			this.boundingSphere = new Sphere();

		}

		if ( this.boundingBox === null ) {

			this.computeBoundingBox();

		}

		const position = this.attributes.instancePosition;

		if ( position !== undefined ) {

			const center = this.boundingSphere.center;

			this.boundingBox.getCenter( center );

			let maxRadiusSq = 0;

			for ( let i = 0, il = position.count; i < il; i ++ ) {

				_vector.fromBufferAttribute( position, i );
				maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( _vector ) );

			}

			this.boundingSphere.radius = Math.sqrt( maxRadiusSq );

			if ( isNaN( this.boundingSphere.radius ) ) {

				console.error( 'InstancedSpriteGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.', this );

			}

		}

	}

}

export { InstancedSpriteGeometry };