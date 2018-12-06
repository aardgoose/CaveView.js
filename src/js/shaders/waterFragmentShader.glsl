
uniform float offset;

varying vec3 vPosition;
varying float vSelection;
varying vec3 vSink;

void main() {

	gl_FragColor = vec4( 0.1, 0.1, sin( offset + distance( vPosition, vSink ) ) * 0.4 + 0.6, 0.0 );
	gl_FragColor = mix( gl_FragColor, vec4( 1.0, 0.0, 0.0, 1.0 ), vSelection );

}
