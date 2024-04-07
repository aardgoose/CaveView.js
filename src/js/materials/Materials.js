import { ColourCache } from '../core/ColourCache';
import { TextureCache } from '../core/TextureCache';
import { IncrementStencilOp } from '../Three';
import { CommonUniforms } from './CommonUniforms';
import { reference, uniform } from '../Nodes';

function Materials ( viewer ) {

	const materialClassCache = new Map();
	const ctx = viewer.ctx;

	let locationMode = false;

	this.colourCache = new ColourCache();
	this.textureCache = new TextureCache()

	this.commonUniforms = new CommonUniforms( ctx );

	this.cursorHeight = 0;
	this.terrainOpacity = 0.5;
	this.linewidth = 1;
	this.cursorWidth = 5;

	this.colorUniformCache = {};
	this.referenceCache = {};

	this.getColorUniform = function ( colorName ) {

		let u = this.colorUniformCache[ colorName ];

		if ( u === undefined ) {

			u = uniform( ctx.cfg.themeColor( colorName ) );
			this.colorUniformCache[ colorName ] = u;

		}

		return u;

	};


	this.refreshColors = function () {

		console.log( 'refresh' );

		for ( const colorName in this.colorUniformCache ) {

			console.log( 'reset color', colorName );

		}

	};

	this.getReference = function ( referenceName ) {

		let r = this.referenceCache[ referenceName ];

		if ( r === undefined ) {

			r = reference( referenceName, 'float', this );
			this.referenceCache[ referenceName ] = r;

		}

		return r;

	};

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

		/*
		const updateMaterial = ( material ) => {

			material.transparent = locationMode;
			material.needsUpdate = true;

		};
		*/

		const commonUniforms = this.commonUniforms;

		if ( location === null ) {

			if ( locationMode ) {

				console.log( 'disable loc' );
				locationMode = false;

				commonUniforms.accuracy.value = -1.0;

			}

		} else {

			if ( ! locationMode ) {

				locationMode = true;

				commonUniforms.accuracy.value = accuracy;

				console.log( 'cut', commonUniforms.target.value );
				console.log( 'cua', commonUniforms.accuracy.value );

			}

			commonUniforms.distanceFadeMin.value = minDistance;
			commonUniforms.distanceFadeMax.value = maxDistance;
			commonUniforms.cameraLocation.value.copy( location );

			commonUniforms.target.value.set( location.x, location.y );

		}

	};

	this.setTerrain = function ( terrain ) {

		this.commonUniforms.updateTerrainUniforms( terrain );

		const updateDatumShifts = event => {

			this.commonUniforms.datumShift.value = event.value;

		};

		terrain.addEventListener( 'datumShiftChange', updateDatumShifts );

	};

	this.setSurvey = function ( survey ) {

		this.commonUniforms.updateSurveyUniforms( survey );

	};

	this.flushCache = function () {

		ctx.glyphStringCache = new Map();
		this.cursorHeight = 0;

	};

}

export { Materials };