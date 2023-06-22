import { ColourCache } from '../core/ColourCache';
import { TextureCache } from '../core/TextureCache';
import { IncrementStencilOp } from '../Three';
import { CommonUniforms } from './CommonUniforms';

function Materials ( viewer ) {

	const materialClassCache = new Map();
	const ctx = viewer.ctx;

	let cursorHeight = 0;
	let linewidth = 1;
	let scaleLinewidth = false;
	let locationMode = false;

	const colourCache = new ColourCache();
	const textureCache = new TextureCache();

	this.colourCache = colourCache;
	this.textureCache = textureCache;

	this.commonUniforms = new CommonUniforms();
	this.terrainOpacity = 0.5;

// FIXME - common uniforms or other mech
	Object.defineProperties( this, {

		'cursorHeight': {
			get() { return cursorHeight; },
			set( newHeight ) {
			}
		},

		'linewidth': {
			get() { return linewidth; },
			set( width ) {
				linewidth = width;
			}
		},

		'scaleLinewidth': {
			get() { return scaleLinewidth; },
			set( mode ) {
				scaleLinewidth = mode;
			}
		}

	} );

	// FIXME add flags for survey specific materials for restting or make materials use object uniforms
	this.getMaterial = function ( materialClass, params = {}, stencil = false ) {

		let materialCache = materialClassCache.get( materialClass );

		if ( ! materialCache ) {

			materialCache = new Map();
			materialClassCache.set( materialClass, materialCache );

		}

		const materialCacheKey = JSON.stringify( params );

		let material = materialCache.get( materialCacheKey );

		if ( ! material ) {

			material = new materialClass( params, ctx );

			if ( stencil ) {

				material.stencilWrite = true;
				material.stencilZPass = IncrementStencilOp;

			}

			materialCache.set( materialCacheKey, material );

		}

		return material;

	}

	this.setLocation = function ( location = null, accuracy = 0, minDistance = 0, maxDistance = 0 ) {

		const updateMaterial = ( material ) => {

			material.defines.CV_LOCATION = locationMode;
			material.transparent = locationMode;
			material.needsUpdate = true;

		};

		const commonUniforms = this.commonUniforms;

		if ( location === null ) {

			if ( locationMode ) {

				console.log( 'disable loc' );
				locationMode = false;

				commonUniforms.accuracy.value = -1.0;

				surveyLineMaterials.forEach( updateMaterial );
				wallMaterials.forEach( updateMaterial );

			}

		} else {

			if ( ! locationMode ) {

				locationMode = true;

				commonUniforms.accuracy.value = accuracy;

				console.log( 'cut', commonUniforms.target.value );
				console.log( 'cua', commonUniforms.accuracy.value );

				surveyLineMaterials.forEach( updateMaterial );
				wallMaterials.forEach( updateMaterial );

			}

			commonUniforms.distanceFadeMin.value = minDistance;
			commonUniforms.distanceFadeMax.value = maxDistance;
			commonUniforms.cameraLocation.value.copy( location );

			commonUniforms.target.value.set( location.x, location.y );

		}

	};

	this.setTerrain = function ( terrain ) {

		const updateDatumShifts = event => {

			this.commonUniforms.datumShift.value = event.value;

		};

		terrain.addEventListener( 'datumShiftChange', updateDatumShifts );

	};

	this.flushCache = function () {

		ctx.glyphStringCache = new Map();
		cursorHeight = 0;

	};

	this.setFog = function ( enable ) {

	};

}

export { Materials };