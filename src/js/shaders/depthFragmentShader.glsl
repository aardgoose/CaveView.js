
uniform sampler2D cmap;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform int fogEnabled;

varying float vDepth;
varying vec3 vColor;
varying float fogDepth;

void main() {

	gl_FragColor = texture2D( cmap, vec2( vDepth, 1.0 ) ) * vec4( vColor, 1.0 );

	if ( fogEnabled != 0 ) {

		float fogFactor = smoothstep( fogNear, fogFar, fogDepth );

		gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

	}

}