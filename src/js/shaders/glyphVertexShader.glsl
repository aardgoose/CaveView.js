

uniform float cellScale;

attribute vec2 instanceUvs;
attribute vec2 instanceOffsets;
attribute float instanceWidths;

varying vec2 vUv;

void main() {

	vec3 newPosition = position * vec3( instanceWidths, 1.0, 1.0 ) + vec3( instanceOffsets, 0.0 );

	vUv = instanceUvs + vec2( position.x * cellScale * instanceWidths, position.y * cellScale );

	gl_Position = vec4( newPosition * vec3( 0.125, 0.125, 1.0 ), 1.0 );

}
