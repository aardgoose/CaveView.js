// unpack GLSL created RGBA packed float values

const unpackDownscale = 255 / ( 256 * 256 );

const unpackFactor0 = unpackDownscale / ( 256 * 256 * 256 );
const unpackFactor1 = unpackDownscale / ( 256 * 256 );
const unpackFactor2 = unpackDownscale / 256;
const unpackFactor3 = unpackDownscale / 1;

function unpackRGBA( buffer, offset ) {

	return unpackFactor0 * buffer[ offset ] +
		unpackFactor1 * buffer[ offset + 1 ] +
		unpackFactor2 * buffer[ offset + 2 ] +
		unpackFactor3 * buffer[ offset + 3 ];

}

export { unpackRGBA };