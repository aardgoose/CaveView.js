import {
	InstancedBufferGeometry, InstancedBufferAttribute,
	Mesh, Vector3, Vector4, Matrix3, Box2, Object3D
} from '../Three';

import { CommonAttributes } from './CommonAttributes';

// temporary objects for raycasting

const _ssOrigin = new Vector4();
const mouse = new Vector3();
const labelEnd = new Vector3();
const labelOrigin = new Vector3();

const labelBox = new Box2();

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

		const l = text.length;

		this.glyphAtlas = glyphAtlas;

		this.setAttribute( 'instanceUvs', new InstancedBufferAttribute( new Float32Array( l * 2 ), 2, false, 1 ) );
		this.setAttribute( 'instanceOffsets', new InstancedBufferAttribute( new Float32Array( l ), 1, false, 1 ) );
		this.setAttribute( 'instanceWidths', new InstancedBufferAttribute( new Float32Array( l ), 1, false, 1 ) );

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

		this.box = new Box2();

		this.box.min.x = 0;
		this.box.min.y = 0;

		this.setBox();

		const a = this.material.rotation;

		this.setRotationMatrix = new Matrix3().set(
			Math.cos( a ),	-Math.sin( a ),	0,
			Math.sin( a ), 	Math.cos( a ),	0,
			0,				0,				0
		);

	}


	setBox () {

		this.box.max.x = this.getWidth();
		this.box.max.y = this.getHeight();

	}

	getWidth () {

		return this.geometry.width * this.material.scaleFactor;

	}

	getHeight () {

		return this.material.scaleFactor;

	}

	getOffset () {

		// FIXME - cache this value
		labelEnd.set( this.getWidth(), this.getHeight(), 0 );
		this.material.rotateVector( labelEnd );

		return labelEnd;

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

		mouse.copy( _ssOrigin );

		mouse.multiply( scale );

		this.getWorldPosition( labelOrigin );

		labelOrigin.project( camera );
		labelOrigin.multiply( scale );

		const labelEnd = this.getOffset();

		labelEnd.add( labelOrigin );

		glyphMaterial.rotateVector( mouse );
		glyphMaterial.rotateVector( labelEnd );
		glyphMaterial.rotateVector( labelOrigin );

		//console.log( 'm', Math.round( mouse.x ), Math.round( mouse.y ) );
		//console.log( 'o', Math.round( labelOrigin.x ), Math.round( labelOrigin.y ) );
		//console.log( 'e', Math.round( labelEnd.x ), Math.round( labelEnd.y ) );

		labelBox.setFromPoints( [ labelOrigin, labelEnd ] );

		if ( labelBox.containsPoint( mouse ) ) {

			intersects.push( { object: this } );

		}
		// this.depth = __v1.z;

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

		geometry.getAttribute( 'instanceUvs' ).onUpload( Object3D.onUploadDropBuffer );
		geometry.getAttribute( 'instanceOffsets' ).onUpload( Object3D.onUploadDropBuffer );
		geometry.getAttribute( 'instanceWidths' ).onUpload( Object3D.onUploadDropBuffer );

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
		this.setBox();

	}

}

export { GlyphString, MutableGlyphString };