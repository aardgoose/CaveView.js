layout(location = 1) out vec3 DistanceMap;

in vec2 vTexCoord;

uniform sampler2D Sampler;
uniform float Beta;
uniform vec2 Offset;

void main()
{
    vec3 this_pixel = texture(Sampler, vTexCoord).rgb;
    vec3 east_pixel = texture(Sampler, vTexCoord + Offset).rgb;
    vec3 west_pixel = texture(Sampler, vTexCoord - Offset).rgb;

    // Squared distance is stored in the BLUE channel.
    float A = this_pixel.b;
    float e = Beta + east_pixel.b;
    float w = Beta + west_pixel.b;
    float B = min(min(A, e), w);

    // If there is no change, discard the pixel.
    // Convergence can be detected using GL_ANY_SAMPLES_PASSED.
    if (A == B) {
        discard;
    }

    DistanceMap.rg = west_pixel.rg;
    DistanceMap.b = B;

    // Closest point coordinate is stored in the RED-GREEN channels.
    if (A <= e && e <= w) DistanceMap.rg = this_pixel.rg;
    if (A <= w && w <= e) DistanceMap.rg = this_pixel.rg;
    if (e <= A && A <= w) DistanceMap.rg = east_pixel.rg;
    if (e <= w && w <= A) DistanceMap.rg = east_pixel.rg;
}