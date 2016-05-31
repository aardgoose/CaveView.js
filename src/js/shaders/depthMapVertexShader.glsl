
uniform float minZ;
uniform float scaleZ;

varying float vHeight;

void main() {

	vHeight = ( position.z - minZ ) * scaleZ;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
