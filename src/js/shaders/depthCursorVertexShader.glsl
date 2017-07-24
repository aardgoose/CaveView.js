
uniform float minX;
uniform float minY;
uniform float minZ;

uniform float scaleX;
uniform float scaleY;
uniform float scaleZ;

uniform sampler2D depthMap;
uniform float datumShift;

#ifdef SURFACE

uniform vec3 uLight;

varying vec3 vNormal;
varying vec3 lNormal;

#else
	
varying vec3 vColor;

#endif

varying float vHeight;

void main() {

#ifdef SURFACE

	vNormal = normalMatrix * normal;
	lNormal = uLight;

#else

	vColor = color;

#endif

	vec2 terrainCoords = vec2( ( position.x - minX ) * scaleX, ( position.y - minY ) * scaleY );
	vec4 terrainHeight = texture2D( depthMap, terrainCoords );

	vHeight =  terrainHeight.g * scaleZ + datumShift + minZ - position.z;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}





