
uniform sampler2D popupImage;

varying vec2 vUv;
varying vec3 vColor;

void main() {

	gl_FragColor = texture2D( popupImage, vUv ) * vec4( vColor, 1.0 );

}