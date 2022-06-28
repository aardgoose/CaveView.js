varying vec2 vUV;

void main() {

	vUV = uv;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}