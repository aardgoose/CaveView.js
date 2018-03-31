
uniform sampler2D cmap;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

varying float vDepth;
varying vec3 vColor;
varying float fogDepth;

void main() {

	float fogFactor = smoothstep( fogNear, fogFar, fogDepth );

	gl_FragColor = texture2D( cmap, vec2( vDepth, 1.0 ) ) * vec4( vColor, 1.0 );

	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

}