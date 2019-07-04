
import {
	CubeTexture, DataTexture,
	RGBFormat, UnsignedByteType, CubeRefractionMapping
} from 'three';

function getSkyBox () {

	const topData = new Uint8Array( [
		117,213,227, 117,213,227, 117,213,227, 117,213,227,
		117,213,227, 117,213,227, 117,213,227, 117,213,227,
		117,213,227, 117,213,227, 117,213,227, 117,213,227,
		117,213,227, 172,245,251, 172,245,251, 117,213,227
	] );

	const sideDataW = new Uint8Array( [
		117,213,227, 117,213,227, 0, 0, 0, 0, 0, 0,
		117,213,227, 117,213,227, 0, 0, 0, 0, 0, 0,
		117,213,227, 117,213,227, 0, 0, 0, 0, 0, 0,
		117,213,227, 117,213,227, 0, 0, 0, 0, 0, 0
	] );

	const sideDataS = new Uint8Array( [
		117,213,227, 172,245,251, 172,245,251, 117,213,227,
		117,213,227, 172,245,251, 172,245,251, 117,213,227,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
	] );

	const sideDataE = new Uint8Array( [
		0, 0, 0, 0, 0, 0, 117,213,227, 117,213,227,
		0, 0, 0, 0, 0, 0, 117,213,227, 117,213,227,
		0, 0, 0, 0, 0, 0, 117,213,227, 117,213,227,
		0, 0, 0, 0, 0, 0, 117,213,227, 117,213,227
	] );

	const sideDataN = new Uint8Array( [
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		117,213,227, 117,213,227, 117,213,227, 117,213,227,
		117,213,227, 117,213,227, 117,213,227, 117,213,227
	] );

	const bottomData = new Uint8Array( [
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
	] );


	const topTexture = new DataTexture( topData, 4, 4, RGBFormat, UnsignedByteType );
	const sideTextureN = new DataTexture( sideDataN, 4, 4, RGBFormat, UnsignedByteType );
	const sideTextureS = new DataTexture( sideDataS, 4, 4, RGBFormat, UnsignedByteType );
	const sideTextureE = new DataTexture( sideDataE, 4, 4, RGBFormat, UnsignedByteType );
	const sideTextureW = new DataTexture( sideDataW, 4, 4, RGBFormat, UnsignedByteType );
	const bottomTexture = new DataTexture( bottomData, 4, 4, RGBFormat, UnsignedByteType );

	const cubeTexture  = new CubeTexture( [
		sideTextureW, sideTextureE, sideTextureN, sideTextureS,
		topTexture, bottomTexture
	], CubeRefractionMapping );

	cubeTexture.needsUpdate = true;

	return cubeTexture;

}

export { getSkyBox };
