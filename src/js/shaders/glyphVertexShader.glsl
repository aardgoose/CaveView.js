

// glyph shader, each instance represents one glyph.

uniform float cellScale;
uniform mat2 rotate;
uniform float scale;

attribute vec2 instanceUvs;
attribute float instanceOffsets;
attribute float instanceWidths;

varying vec2 vUv;

void main() {

	// select glyph from atlas ( with proportional spacing ).

	vUv = instanceUvs + vec2( position.x * cellScale * instanceWidths, position.y * cellScale );

	// scale by glyph width ( vertices form unit square with (0,0) origin )

	vec2 newPosition = vec2( position.x * instanceWidths, position.y );

	// move to correct offset in string

	newPosition.x += instanceOffsets;

	// rotate as required

	newPosition = rotate * newPosition;

	// position of GlyphString object on screeno

	vec4 offset = projectionMatrix * modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );

	// scale glyphs

	newPosition.xy *= 0.0625;

	// correct for aspect ratio

	newPosition.x *= scale;

	// move to clip space

	newPosition.xy *= offset.w;

	gl_Position = vec4( newPosition, 0.0, 0.0 ) + offset;

}
