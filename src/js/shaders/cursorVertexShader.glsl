
#ifdef SURFACE

uniform vec3 uLight;
varying vec3 vNormal;
varying vec3 lNormal;

#else
	
varying vec3 vColor;

#endif

varying float height;

void main() {

#ifdef SURFACE

	vNormal = normalMatrix * normal;
	lNormal = uLight;

#else

	vColor = color;

#endif

	height = position.z;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
