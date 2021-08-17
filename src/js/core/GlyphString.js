import {
	InstancedBufferGeometry, InstancedBufferAttribute,
	Mesh, Vector3, Triangle, Object3D
} from '../Three';

import { CommonAttributes } from './CommonAttributes';

function GlyphStringGeometryCache ( material ) {

	this.material = material;
	this.cache = {};

}

GlyphStringGeometryCache.prototype.getGeometry = function ( text ) {

	let entry = this.cache[ text ];

	if ( entry === undefined ) {

		entry = new GlyphStringGeometry( text, this.material.getAtlas() );
		this.cache[ text ] = entry;
		entry.isCached = true;

	}

	return entry;

};

const __v0 = new Vector3();
const __v1 = new Vector3();
const __v2 = new Vector3();
const __v3 = new Vector3();
const __v4 = new Vector3();

const __triangle1 = new Triangle();
const __triangle2 = new Triangle();

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

}

GlyphStringGeometry.prototype.setString = function ( text ) {

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

};

class GlyphStringBase extends Mesh {

	constructor ( text, glyphMaterial, geometry ) {

		super( geometry, glyphMaterial );
		this.name = text;

	}

}

GlyphStringBase.prototype.getWidth = function () {

	return this.geometry.width * this.material.scaleFactor;

};

GlyphStringBase.prototype.getHeight = function () {

	return this.material.scaleFactor;

};

GlyphStringBase.prototype.intersects = function ( position, camera, scale ) {

	if ( ! this.visible ) return false;

	const width = this.getWidth() / scale.x;
	const height = this.getHeight() / scale.y;
	const rotation = this.material.rotation;

	// mouse position in NDC
	__v0.set( position.x, position.y, 0 );

	// label bottom left in NDC
	__v1.setFromMatrixPosition( this.modelViewMatrix );
	__v1.applyMatrix4( camera.projectionMatrix );

	this.depth = __v1.z;

	__v1.z = 0;

	if ( isNaN( __v1.x ) ) return;

	// remaining vertices of label
	__v2.set( width, 0, 0 ).applyAxisAngle( Object3D.DefaultUp, rotation );
	__v3.set( width, height, 0 ).applyAxisAngle( Object3D.DefaultUp, rotation );
	__v4.set( 0, height, 0 ).applyAxisAngle( Object3D.DefaultUp, rotation );

	// adjust for aspect ratio
	__v2.y *= scale.x / scale.y;
	__v3.y *= scale.x / scale.y;
	__v4.y *= scale.x / scale.y;

	__v2.add( __v1 );
	__v3.add( __v1 );
	__v4.add( __v1 );

	__triangle1.set( __v1, __v2, __v3 );
	__triangle2.set( __v1, __v3, __v4 );

	return (
		( __triangle1.containsPoint( __v0 ) ) ||
		( __triangle2.containsPoint( __v0 ) )
	);

};

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

	}

}

export { GlyphString, MutableGlyphString };