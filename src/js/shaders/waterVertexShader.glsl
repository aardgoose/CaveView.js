
attribute vec3 sinks;

varying vec3 vPosition;
varying vec3 vSink;

void main() {

	vPosition = position;
	vSink = sinks;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
