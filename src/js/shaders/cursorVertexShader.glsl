
#ifdef SURFACE

varying vec3 vNormal;

#else
	
varying vec3 vColor;

#endif

varying float height;

void main() {

#ifdef SURFACE

	vNormal = normalMatrix * normal;

#else

	vColor = color;

#endif

	height = position.z;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
