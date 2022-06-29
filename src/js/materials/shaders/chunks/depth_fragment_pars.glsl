const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)

const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

float unpackRGBAToFloat( const in vec4 v ) {
	return dot( v, UnpackFactors );
}

uniform sampler2D depthMap;
uniform sampler2D cmap;

uniform vec3 modelMin;

uniform float depthScale;
uniform float rangeZ;
uniform float datumShift;

varying vec2 vTerrainCoords;
varying float vZ;
