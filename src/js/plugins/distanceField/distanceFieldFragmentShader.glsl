
#include <packRGBA>

uniform sampler2D tSource;
uniform float beta;
uniform vec2 offset;

varying vec2 vUV;

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