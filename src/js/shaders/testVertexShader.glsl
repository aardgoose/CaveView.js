
#include <common>

uniform float spread;
uniform float rIn;

void main() {

	vec3 nPosition = position;

	nPosition.x += rand( nPosition.xy * rIn ) * color.r * spread;
	nPosition.y += rand( nPosition.xx * rIn ) * color.r * spread;
	nPosition.z -= abs( rand( nPosition.yx * rIn ) ) * color.r * spread;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( nPosition, 1.0 );

	gl_PointSize = 2.0;

}
