

// popup shader

uniform mat2 rotate;
uniform float scale;

varying vec2 vUv;
varying vec3 vColor;

void main() {

	// FIXME - needs adjust to form factor of popup
	vec2 newPosition = vec2( position.x, position.y );

	vColor = color;

	// select glyph from atlas ( with proportional spacing ).

	vUv = vec2( position.x, position.y );

	// rotate as required

	newPosition = rotate * newPosition;

	// position of Popup object on screen

	vec4 offset = projectionMatrix * modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );

	// scale popup

	newPosition.xy *= 0.25;

	// correct for aspect ratio

	newPosition.x *= scale;

	// move to clip space

	newPosition.xy *= offset.w;

	gl_Position = vec4( newPosition, 0.0, 0.0 ) + offset;

}
