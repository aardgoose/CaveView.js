import { CommonTerrainMaterial } from './CommonTerrainMaterial';

const vertexPars = [
	'uniform float minZ;',
	'uniform float scaleZ;',
	'varying float zMap;',
	'varying vec2 vPosition;'
].join( '\n' );

const vertexMain = [
	'vPosition = vec2( position.x, position.y );',
	'zMap = saturate( ( position.z - minZ ) * scaleZ );'
].join( '\n' );

const fragmentPars = [
	'uniform sampler2D cmap;',
	'varying float zMap;'
].join( '\n' );

const fragmentColor = [
	'diffuseColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) );',
	'diffuseColor.a = opacity;'
].join( '\n' );

class HypsometricMaterial extends CommonTerrainMaterial {

	constructor ( ctx ) {

		const survey = ctx.survey;
		const cfg = ctx.cfg;
		const terrain = survey.terrain;
		const textureCache = ctx.materials.textureCache;

		super();

		let zMin = cfg.themeValue( 'shading.hypsometric.min' );
		let zMax = cfg.themeValue( 'shading.hypsometric.max' );

		if ( terrain.boundBox === undefined ) terrain.computeBoundingBox();

		if ( zMin === undefined ) zMin = terrain.boundingBox.min.z;
		if ( zMax === undefined ) zMax = terrain.boundingBox.max.z;

		this.transparent = true;

		this.onBeforeCompile = function ( shader ) {

			Object.assign(
				shader.uniforms,
				{
					minZ:   { value: zMin },
					scaleZ: { value: 1 / ( zMax - zMin ) },
					cmap:   { value: textureCache.getTexture( 'hypsometric' ) }
				}
			);

			this.editShader( shader, vertexPars, vertexMain, fragmentPars, fragmentColor );

		};

		Object.defineProperty( this, 'opacity', {
			get: function () { return ctx.materials.terrainOpacity; }
		} );

	}

}

export { HypsometricMaterial };