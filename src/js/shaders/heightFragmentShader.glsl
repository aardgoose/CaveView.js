#define saturate(a) clamp( a, 0.0, 1.0 )
#define whiteCompliment(a) ( 1.0 - saturate( a ) )
#define LOG2 1.442695

uniform sampler2D cmap;

uniform vec3 fogColor;
uniform int fogEnabled;
uniform float fogDensity;

varying float fogDepth;

varying float zMap;
varying vec3 vColor;

void main() {

	gl_FragColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) ) * vec4( vColor, 1.0 );

	if ( fogEnabled != 0 ) {

		float fogFactor = whiteCompliment( exp2( - fogDensity * fogDensity * fogDepth * fogDepth * LOG2 ) );

		gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

	}

}
