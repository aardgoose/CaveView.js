
uniform float datumShift;
uniform float zAdjust;
varying vec3 vNormal;


varying float vPositionZ;

void main() {

	vNormal = normalMatrix * normal;

	// FIXME ( single uniform )
	vPositionZ = position.z + zAdjust + datumShift;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
