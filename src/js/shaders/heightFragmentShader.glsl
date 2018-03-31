
//#ifdef USE_FOG

uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

varying float fogDepth;

//#endif

uniform sampler2D cmap;

varying float zMap;
varying vec3 vColor;

void main() {

	float fogFactor = smoothstep( fogNear, fogFar, fogDepth );

	gl_FragColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) ) * vec4( vColor, 1.0 );

	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

}
