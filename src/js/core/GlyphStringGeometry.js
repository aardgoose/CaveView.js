import {
	InstancedBufferGeometry,
	InstancedBufferAttribute, Float32BufferAttribute
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

		const length = text.length;

		this.setAttribute( 'instanceUV', new InstancedBufferAttribute( new Float32Array( length * 2 ), 2, false, 1) );
		this.setAttribute( 'instanceOffset', new InstancedBufferAttribute( new Float32Array( length ), 1, false, 1 ) );
		this.setAttribute( 'instanceWidth', new InstancedBufferAttribute( new Float32Array( length ), 1, false, 1 ) );

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