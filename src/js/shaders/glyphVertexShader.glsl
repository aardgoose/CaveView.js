

uniform float cellScale;
uniform mat4 rotate;

attribute vec2 instanceUvs;
attribute float instanceOffsets;
attribute float instanceWidths;

varying vec2 vUv;
varying vec3 vColor;

void main() {

	vColor = color;

	// select glyph from atlas ( with proportional spacing ).

	vUv = instanceUvs + vec2( position.x * cellScale * instanceWidths, position.y * cellScale );

	// position of glyph relative to start of string and right hand side scaled by glyph width

	vec4 newPosition = vec4( position * vec3( instanceWidths, 1.0, 1.0 ) + vec3( instanceOffsets, 0.0, 0.0 ), 1.0 );

	newPosition = rotate * newPosition;

	// position of GlyphString object on screen

	vec4 offset = projectionMatrix * modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );

	gl_Position = newPosition * vec4( 0.25, 0.25, 1.0, 1.0 ) + offset;

}
