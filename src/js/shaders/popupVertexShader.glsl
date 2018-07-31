

// popup shader

uniform mat2 rotate;
uniform vec2 scale;

varying vec2 vUv;
varying vec3 vColor;

void main() {

	// FIXME - needs adjust to form factor of popup
	vec2 newPosition = vec2( position.x, position.y );

	vColor = color;

	vUv = newPosition;

	// rotate as required

	newPosition = rotate * newPosition;

	// position of Popup object on screen

	vec4 offset = projectionMatrix * modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );

	// scale popup

	newPosition *= scale;

	// move to clip space

	newPosition *= offset.w;

	gl_Position = vec4( newPosition, 0.0, 0.0 ) + offset;

}
