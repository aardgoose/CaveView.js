
uniform sampler2D atlas;

uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform int fogEnabled;

varying float fogDepth;
varying vec2 vUv;

void main() {


	gl_FragColor = texture2D( atlas, vUv );

	if ( fogEnabled != 0 ) {

		float fogFactor = smoothstep( fogNear, fogFar, fogDepth );
		gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

	}

}