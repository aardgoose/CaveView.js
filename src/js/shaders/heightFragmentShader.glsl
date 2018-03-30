
uniform sampler2D cmap;

varying float zMap;
varying vec3 vColor;

void main() {

	gl_FragColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) ) * vec4( vColor, 1.0 );

}