
uniform sampler2D tSource;
uniform float beta;
uniform vec2 offset;

varying vec2 vUV;

const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)

const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;

vec4 packFloatToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8; // tidy overflow
	return r * PackUpscale;
}

float unpackRGBAToFloat( const in vec4 v ) {
	return dot( v, UnpackFactors );
}

void main () {

    vec4 this_pixel = texture( tSource,  vUV );
    vec4 east_pixel = texture( tSource,  vUV + offset );
    vec4 west_pixel = texture( tSource,  vUV - offset );

    // Squared distance is stored in the BLUE channel.
    float A = unpackRGBAToFloat( this_pixel );
    float e = beta + unpackRGBAToFloat( east_pixel );
    float w = beta + unpackRGBAToFloat( west_pixel );
    float B = min( min( A, e ), w );

    // If there is no change, discard the pixel.
    // Convergence can be detected using GL_ANY_SAMPLES_PASSED.

    if ( A == B ) {

        discard;

    }

    gl_FragColor = packFloatToRGBA( B );

}