import {
	InstancedBufferGeometry, InstancedInterleavedBuffer, InterleavedBufferAttribute,
	Mesh, Vector2, Vector3, Vector4, Box2, Object3D
} from '../Three';

import { CommonAttributes } from './CommonAttributes';

// temporary objects for raycasting

const _ssOrigin = new Vector4();
const _mouse = new Vector3();
const _labelEnd = new Vector3();
const _ssLabelOrigin = new Vector3();

class GlyphStringGeometryCache {

	constructor ( material ) {

		this.material = material;
		this.cache = {};

	}

	getGeometry ( text ) {

		let entry = this.cache[ text ];

		if ( entry === undefined ) {

			entry = new GlyphStringGeometry( text, this.material.getAtlas() );
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
		this.instanceCount = l;

	}

}


class GlyphStringBase extends Mesh {

	constructor ( text, glyphMaterial, geometry ) {

		super( geometry, glyphMaterial );

		this.name = text;

		this.labelOrigin = new Vector3();
		this.labelOffset = new Vector2();
		this.labelBox = new Box2();
		this.lastFrame = 0;

		this.updateLabelOffset();

	}

	getWidth () {

		return this.geometry.width * this.material.scaleFactor;

	}

	getHeight () {

		return this.material.scaleFactor;

	}

	updateLabelOffset () {

		this.labelOffset.set( this.getWidth(), this.getHeight(), 0 );

		this.material.rotateVector( this.labelOffset );
		this.material.rotateVector( this.labelOffset );

	}

	updateLabelBox ( camera ) {

		const glyphMaterial = this.material;
		const scale = glyphMaterial.toScreenSpace;
		const labelOrigin = this.labelOrigin;

		// get box origin in screen space
		this.getWorldPosition( _ssLabelOrigin );

		labelOrigin.copy( _ssLabelOrigin );
		labelOrigin.project( camera );
		labelOrigin.multiply( scale );

		// rotate into alignment with text rotation
		glyphMaterial.rotateVector( labelOrigin );

		// find other corner = origin + offset (maintained in coords aligned with rotation)
		_labelEnd.copy( labelOrigin );
		_labelEnd.add( this.labelOffset );

		this.labelBox.setFromPoints( [labelOrigin, _labelEnd ] );

	}

	getDepth( cameraManager ) {

		if ( this.lastFrame < cameraManager.getLastFrame() ) {

			this.updateLabelBox( cameraManager.activeCamera );
			this.lastFrame = cameraManager.getLastFrame();

		}

		// label origin in screen space
		return this.labelOrigin.z;

	}

	checkOcclusion ( labels, currentIndex ) {

		if ( ! this.visible ) return;

		const l = labels.length;

		for ( let i = currentIndex  + 1; i < l; i++ ) {

			const nextLabel = labels[ i ];

			if ( ! nextLabel.visible ) continue;

			if ( this.labelBox.intersectsBox( nextLabel.labelBox ) ) {

				this.visible = false;
				return;

			}

		}

	}

	raycast ( raycaster, intersects ) {

		if ( ! this.visible ) return intersects;

		const ray = raycaster.ray;
		const camera = raycaster.camera;
		const glyphMaterial = this.material;
		const scale = glyphMaterial.toScreenSpace;

		ray.at( 1, _ssOrigin );

		// ndc space [ - 1.0, 1.0 ]

		_ssOrigin.w = 1;

		_ssOrigin.applyMatrix4( camera.matrixWorldInverse );
		_ssOrigin.applyMatrix4( camera.projectionMatrix );
		_ssOrigin.multiplyScalar( 1 / _ssOrigin.w );

		// screen space
		_mouse.copy( _ssOrigin );
		_mouse.multiply( scale );

		// rotated screen space
		glyphMaterial.rotateVector( _mouse );

		// FIXME - we don't check for objects outside of view
		this.updateLabelBox( camera );

		//console.log( 'm', Math.round( mouse.x ), Math.round( mouse.y ) );
		//console.log( 'o', Math.round( labelOrigin.x ), Math.round( labelOrigin.y ) );
		//console.log( 'e', Math.round( labelEnd.x ), Math.round( labelEnd.y ) );

		if ( this.labelBox.containsPoint( _mouse ) ) {

			intersects.push( { object: this, distance: raycaster.ray.origin.distanceTo( _ssLabelOrigin ) } );

		}

		return intersects;

	}

}

class GlyphString extends GlyphStringBase {

	constructor ( text, glyphMaterial, ctx ) {

		const glyphStringCache = ctx.glyphStringCache;

		let cache = glyphStringCache.get( glyphMaterial );

		if ( cache === undefined ) {

			// create material cache
			cache = new GlyphStringGeometryCache( glyphMaterial );
			glyphStringCache.set( glyphMaterial, cache );

		}

		const geometry = cache.getGeometry( text );

		super( text, glyphMaterial, geometry );

		geometry.instanceBuffer.onUpload( Object3D.onUploadDropBuffer );

	}

}

class MutableGlyphString extends GlyphStringBase {

	constructor ( text, glyphMaterial ) {

		super( text, glyphMaterial, new GlyphStringGeometry( text, glyphMaterial.getAtlas() ) );

	}

	replaceString ( newstring ) {

		if ( newstring.length !== this.name.length ) {

			console.warn( 'new string has invalid length', newstring, this.name.length, newstring.length );
			return;

		}

		this.geometry.setString( newstring );
		this.updateLabelOffset();

	}

}

export { GlyphString, MutableGlyphString };