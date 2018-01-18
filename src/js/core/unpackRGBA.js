// unpack GLSL created RGBA packed float values

const unpackDownscale = 255 / ( 256 * 256 );

const unpackFactor0 = unpackDownscale / ( 256 * 256 * 256 );
const unpackFactor1 = unpackDownscale / ( 256 * 256 );
const unpackFactor2 = unpackDownscale / 256;
const unpackFactor3 = unpackDownscale / 1;

function unpackRGBA( buffer ) {

	return unpackFactor0 * buffer[ 0 ] +
		unpackFactor1 * buffer[ 1 ] +
		unpackFactor2 * buffer[ 2 ] +
		unpackFactor3 * buffer[ 3 ];

}

export { unpackRGBA };