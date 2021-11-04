import {
	InstancedBufferGeometry, InstancedInterleavedBuffer,
	InterleavedBufferAttribute, Float32BufferAttribute
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

	constructor ( text, glyphAtlas, yOffset = 0 ) {

		super();

		this.type = 'GlyphStringGeometry';
		this.width = 0;

		yOffset /= glyphAtlas.cellSize;

		this.setIndex( CommonAttributes.index );
		this.setAttribute( 'position', CommonAttributes.position );
		this.setAttribute( 'offsets', new Float32BufferAttribute( [ yOffset, yOffset, yOffset, yOffset, yOffset, yOffset ], 1 ) );

		this.glyphAtlas = glyphAtlas;

		const buffer = new Float32Array( text.length * 4 );
		const instanceBuffer = new InstancedInterleavedBuffer( buffer, 4, 1 ); // uv, offset, widths

		this.instanceBuffer = instanceBuffer;

		this.setAttribute( 'instanceUvs', new InterleavedBufferAttribute( instanceBuffer, 2, 0 ) );
		this.setAttribute( 'instanceOffsets', new InterleavedBufferAttribute( instanceBuffer, 1, 2 ) );
		this.setAttribute( 'instanceWidths', new InterleavedBufferAttribute( instanceBuffer, 1, 3 ) );

		this.setString( text );

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

		const instanceUvs = this.getAttribute( 'instanceUvs' );
		const instanceOffsets = this.getAttribute( 'instanceOffsets' );
		const instanceWidths = this.getAttribute( 'instanceWidths' );

		const l = text.length, glyphAtlas = this.glyphAtlas;

		let offset = 0;

		for ( let i = 0; i < l; i++ ) {

			if ( text.charCodeAt( i ) === 0 ) continue; // skip null characters
			const glyphData = glyphAtlas.getGlyph( text[ i ] );

			instanceUvs.setXY( i, glyphData.column, glyphData.row );
			instanceWidths.setX( i, glyphData.width );
			instanceOffsets.setX( i, offset );

			offset += glyphData.width;

		}

		instanceUvs.needsUpdate = true;
		instanceOffsets.needsUpdate = true;
		instanceWidths.needsUpdate = true;

		this.width = offset;
		this.name = text;

	}

}

export { GlyphStringGeometry, GlyphStringGeometryCache };