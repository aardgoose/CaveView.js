import {
	InstancedBufferGeometry, InterleavedBufferAttribute,
	Float32BufferAttribute, InstancedInterleavedBuffer,
} from '../Three';

import { CommonAttributes } from './CommonAttributes';

class GlyphStringGeometryCache {

	constructor ( material ) {

		this.material = material;
		this.cache = {};

	}

	getGeometry ( text, yOffset ) {

		let entry = this.cache[ text ];

		if ( entry === undefined ) {

			entry = new GlyphStringGeometry( text, this.material.getAtlas(), yOffset );
			this.cache[ text ] = entry;
			entry.isCached = true;

		}

		return entry;

	}

}

class GlyphStringGeometry extends InstancedBufferGeometry {

	constructor ( text, glyphAtlas ) {

		super();

		this.type = 'GlyphStringGeometry';
		this.width = 0;

		this.setIndex( CommonAttributes.index );
		this.setAttribute( 'position', CommonAttributes.position );

		this.glyphAtlas = glyphAtlas;

		const length = text.length;

		const instanceBuffer = new InstancedInterleavedBuffer( new Float32Array( length * 4 ), 4, 1 ); // xyz, xyz

		this.setAttribute( 'instanceUV', new InterleavedBufferAttribute( instanceBuffer, 2, 0) );
		this.setAttribute( 'instanceOffset', new InterleavedBufferAttribute( instanceBuffer, 1, 2 ) );
		this.setAttribute( 'instanceWidth', new InterleavedBufferAttribute( instanceBuffer, 1, 3 ) );

		this.setString( text );

		this.instanceCount = length;

		this.computeBoundingSphere();

	}

	dispose () {

		if ( this.isCached ) return;

		// delete shared attributes to prevent internal render state
		// being lost on dispose() call.

		this.deleteAttribute( 'position' );
		this.setIndex( null );

		super.dispose();

	}

	setString ( text ) {

		const instanceUV = this.getAttribute( 'instanceUV' );
		const instanceOffset = this.getAttribute( 'instanceOffset' );
		const instanceWidth = this.getAttribute( 'instanceWidth' );

		const l = text.length, glyphAtlas = this.glyphAtlas;

		let offset = 0;

		for ( let i = 0; i < l; i++ ) {

			if ( text.charCodeAt( i ) === 0 ) continue; // skip null characters
			const glyphData = glyphAtlas.getGlyph( text[ i ] );

			instanceUV.setXY( i, glyphData.column, glyphData.row );
			instanceWidth.setX( i, glyphData.width );
			instanceOffset.setX( i, offset );

			offset += glyphData.width;

		}

		instanceUV.needsUpdate = true;
		instanceOffset.needsUpdate = true;
		instanceWidth.needsUpdate = true;

		this.width = offset;
		this.name = text;

	}

}

export { GlyphStringGeometry, GlyphStringGeometryCache };