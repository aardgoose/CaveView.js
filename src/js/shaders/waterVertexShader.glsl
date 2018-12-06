
attribute vec3 sinks;
attribute float selection;

varying vec3 vPosition;
varying float vSelection;
varying vec3 vSink;

void main() {

	vPosition = position;
	vSelection = selection;
	vSink = sinks;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
