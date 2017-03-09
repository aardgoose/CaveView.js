#define RECIPROCAL_PI 0.31830988618

uniform sampler2D cmap;

varying float vAspect;
varying vec3 vNormal;

void main() {

//	vNormal = normalMatrix * normal;
	vNormal = normal;

	vec3 tmp;
	vec3 horizontalVector;

	tmp = normal;
	tmp.z = 0.0;

	horizontalVector = normalize( tmp );
	
	vAspect = acos( dot( horizontalVector, vec3( 1.0, 0.0, 0.0 ) ) ) * RECIPROCAL_PI + 0.5;

	if ( sign( tmp.y ) == -1.0 ) {

		vAspect = vAspect + 1.0;

	}

	vAspect = vAspect / 2.0;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
