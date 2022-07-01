#include <packRGBA>

uniform sampler2D tDiffuse;
varying vec2 vUV;

const vec3 filterColour = vec3( 0.99, 0.99, 0.99 );

void main() {

	vec4 colour = texture2D( tDiffuse, vUV );

	if ( all( lessThan( colour.rgb, filterColour ) ) ) {

		gl_FragColor = packFloatToRGBA( 0.0 );

	} else {

		gl_FragColor = packFloatToRGBA( 1.0 );

	}

}