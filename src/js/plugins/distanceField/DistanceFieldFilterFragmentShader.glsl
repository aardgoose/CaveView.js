
const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );

const float ShiftRight8 = 1. / 256.;

vec4 packFloatToRGBA( const in float v ) {

	vec4 r = vec4( fract( v * PackFactors ), v );

	r.yzw -= r.xyz * ShiftRight8; // tidy overflow

	return r * PackUpscale;

}

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