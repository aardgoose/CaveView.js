
uniform vec3 uLight;

varying vec3 vNormal;
varying vec3 lNormal;
varying vec2 vUv;

void main() {

	vNormal = normalMatrix * normal;
	lNormal = uLight;
	vUv = uv;	

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
