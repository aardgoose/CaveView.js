
uniform float datumShift;
uniform float zAdjust;

varying float vPositionZ;

void main() {

	// FIXME ( single uniform )
	vPositionZ = position.z + zAdjust + datumShift;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
