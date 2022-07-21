#include <packRGBA>

uniform sampler2D depthMap;
uniform sampler2D cmap;

uniform vec3 modelMin;

uniform float depthScale;
uniform float rangeZ;
uniform float datumShift;

varying vec2 vTerrainCoords;