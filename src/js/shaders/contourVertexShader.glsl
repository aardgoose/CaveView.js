
uniform float datumShift;

varying vec3 vPosition;

void main() {

	vPosition = position;

	vPosition.z = vPosition.z + datumShift;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
