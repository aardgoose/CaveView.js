
uniform sampler2D atlas;

varying vec2 vUv;
varying vec3 vColor;

void main() {

	gl_FragColor = texture2D( atlas, vUv ) * vec4( vColor, 1.0 );

}