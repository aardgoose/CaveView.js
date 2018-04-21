
#define saturate(a) clamp( a, 0.0, 1.0 )
#define whiteCompliment(a) ( 1.0 - saturate( a ) )
#define LOG2 1.442695

uniform sampler2D atlas;

uniform vec3 fogColor;
uniform int fogEnabled;
uniform float fogDensity;

varying float fogDepth;
varying vec2 vUv;

void main() {

	gl_FragColor = texture2D( atlas, vUv );

	if ( fogEnabled != 0 ) {

		float fogFactor = whiteCompliment( exp2( - fogDensity * fogDensity * fogDepth * fogDepth * LOG2 ) );

		gl_FragColor = mix( gl_FragColor, vec4( fogColor, 0.0 ), fogFactor );

	}

}