
uniform sampler2D cmap;

uniform float minZ;
uniform float scaleZ;

#ifdef SURFACE

varying vec3 vNormal;

#else

varying vec3 vColor;

#endif

varying float zMap;

void main() {

#ifdef SURFACE

	vNormal = normalMatrix * normal;

#else

	vColor = color;

#endif

	zMap = ( position.z - minZ ) * scaleZ;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
