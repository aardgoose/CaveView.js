
uniform float minX;
uniform float minY;
uniform float minZ;

uniform float scaleX;
uniform float scaleY;
uniform float scaleZ;

uniform sampler2D depthMap;

varying vec3 vColor;
varying float vHeight;

void main() {

	vColor = color;

	vec2 terrainCoords = vec2( ( position.x - minX ) * scaleX, ( position.y - minY ) * scaleY );
	vec4 terrainHeight = texture2D( depthMap, terrainCoords );

	vHeight =  terrainHeight.g * scaleZ + minZ - position.z;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
