#include <fog_pars_fragment>
#include <wall_fragment_pars>
#include <cursor_fragment_pars>
#include <depth_fragment_pars>
#include <location_fade_fragment_pars>

void main() {

	float terrainHeight = unpackRGBAToFloat( texture2D( depthMap, vTerrainCoords ) );

	terrainHeight = terrainHeight * rangeZ + modelMin.z + datumShift;

	float vCursor = terrainHeight - vPosition.z;

	#include <cursor_fragment>
	#include <location_fade_fragment>
	#include <fog_fragment>

}