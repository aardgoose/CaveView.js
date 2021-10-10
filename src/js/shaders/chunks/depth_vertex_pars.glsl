#define saturate(a) clamp( a, 0.0, 1.0 )

const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)

const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

float unpackRGBAToFloat( const in vec4 v ) {
	return dot( v, UnpackFactors );
}

uniform vec3 modelMin;

uniform float scaleX;
uniform float scaleY;
uniform float rangeZ;

uniform sampler2D depthMap;
uniform float datumShift;
varying float vDepth;