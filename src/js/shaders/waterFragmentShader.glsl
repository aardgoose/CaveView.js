
uniform float offset;

varying vec3 vPosition;
varying vec3 vSink;

void main() {

	gl_FragColor = vec4( 0.1, 0.1, sin( offset + distance( vPosition, vSink ) ) * 0.4 + 0.6, 0.0 );

}
