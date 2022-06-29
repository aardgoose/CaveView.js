#include <fog_pars_fragment>
#include <wall_fragment_pars>
#include <depth_fragment_pars>

void main() {

	float terrainHeight = unpackRGBAToFloat( texture2D( depthMap, vTerrainCoords ) );

	terrainHeight = terrainHeight * rangeZ + modelMin.z + datumShift;

	float depth = ( terrainHeight - vZ ) * depthScale;

	gl_FragColor = texture2D( cmap, vec2( depth, 1.0 ) ) * vec4( vColor, 1.0 );

	#include <fog_fragment>

}