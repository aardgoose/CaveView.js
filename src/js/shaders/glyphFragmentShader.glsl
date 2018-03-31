
uniform sampler2D atlas;

uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

varying float fogDepth;
varying vec2 vUv;

void main() {

	float fogFactor = smoothstep( fogNear, fogFar, fogDepth );

	gl_FragColor = texture2D( atlas, vUv );

	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

}