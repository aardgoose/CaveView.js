

// glyph shader, each instance represents one glyph.

uniform float cellScale;
uniform mat4 rotate;
uniform float scale;

attribute vec2 instanceUvs;
attribute float instanceOffsets;
attribute float instanceWidths;

varying vec2 vUv;
varying vec3 vColor;

void main() {

	vColor = color;

	// select glyph from atlas ( with proportional spacing ).

	vUv = instanceUvs + vec2( position.x * cellScale * instanceWidths, position.y * cellScale );

	// scale by glyph width ( vertices form unit square with (0,0) origin )

	vec4 newPosition = vec4( position.x * instanceWidths, position.y, 1.0, 1.0 );

	// move to correct offset in string

	newPosition.x += instanceOffsets;

	// rotate as required

//	newPosition = rotate * newPosition;

	// position of GlyphString object on screeno

	vec4 offset = projectionMatrix * modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );

	// scale glyphs

	newPosition.xy *= 0.0625;

	// correct for aspect ratio

	newPosition.x *= scale;

	// move to clip space

	newPosition.xy *= offset.w;
	newPosition.w = 0.0;

	gl_Position = newPosition + offset;

}
