uniform sampler2D cmap;

varying float zMap;
varying float vDotNL;

void main() {

	gl_FragColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) ) * vDotNL;

}