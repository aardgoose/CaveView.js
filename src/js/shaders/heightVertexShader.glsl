
uniform sampler2D cmap;

uniform float minZ;
uniform float scaleZ;

#ifdef SURFACE

uniform vec3 uLight;

varying vec3 vNormal;
varying vec3 lNormal;

#else

varying vec3 vColor;

#endif

varying float zMap;

void main() {

#ifdef SURFACE

	vNormal = normalMatrix * normal;
	lNormal = uLight;

#else

	vColor = color;

#endif

	zMap = ( position.z - minZ ) * scaleZ;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
