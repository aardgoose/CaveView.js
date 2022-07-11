import { Box2, Mesh, Object3D, Vector2, Vector3, Vector4 } from '../Three';
import { GlyphStringGeometry, GlyphStringGeometryCache } from './GlyphStringGeometry';

// temporary objects for raycasting

const _ssOrigin = new Vector4();
const _mouse = new Vector3();
const _labelEnd = new Vector3();
const _ssLabelOrigin = new Vector3();

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

		this.labelBox.setFromPoints( [ labelOrigin, _labelEnd ] );

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

		if ( this.labelBox.containsPoint( _mouse ) ) {

			intersects.push( { object: this, distance: raycaster.ray.origin.distanceTo( _ssLabelOrigin ) } );

		}

		return intersects;

	}

}

class GlyphString extends GlyphStringBase {

	constructor ( text, glyphMaterial, ctx, yOffset ) {

		const glyphStringCache = ctx.glyphStringCache;

		let cache = glyphStringCache.get( glyphMaterial );

		if ( cache === undefined ) {

			// create material cache
			cache = new GlyphStringGeometryCache( glyphMaterial );
			glyphStringCache.set( glyphMaterial, cache );

		}

		const geometry = cache.getGeometry( text, yOffset );

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