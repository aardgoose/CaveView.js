import {
	ShaderMaterial,
	UniformsLib,
	UniformsUtils,
	Vector2
} from '../three';
import { Shaders } from '../shaders/Shaders';

const uniforms = UniformsUtils.merge( [
	UniformsLib.common,
	UniformsLib.fog,
	{
		linewidth: { value: 1 },
		resolution: { value: new Vector2( 1, 1 ) },
		dashScale: { value: 1 },
		dashSize: { value: 1 },
		dashOffset: { value: 0 },
		gapSize: { value: 1 }, // todo FIX - maybe change to totalSize
		opacity: { value: 1 }
	}
] );

class Line2Material extends ShaderMaterial {

	constructor ( ctx, params, defines = { CV_BASIC: true }, callerUniforms = {} ) {

		super( {

			type: 'LineMaterial',

			uniforms: Object.assign(
				UniformsUtils.clone( uniforms ),
				ctx.materials.uniforms.common,
				callerUniforms
			),

			vertexShader: Shaders.lineVertexShader,
			fragmentShader: Shaders.lineFragmentShader,

			clipping: true, // required for clipping support
			defines: defines
		} );

		this.dashed = false;
		this.ctx = ctx;

		Object.defineProperties( this, {

			color: {

				enumerable: true,

				get: function () {

					return this.uniforms.diffuse.value;

				},

				set: function ( value ) {

					this.uniforms.diffuse.value = value;

				}

			},

			linewidth: {

				enumerable: true,

				get: function () {

					return this.uniforms.linewidth.value;

				},

				set: function ( value ) {

					this.uniforms.linewidth.value = value;

				}

			},

			dashScale: {

				enumerable: true,

				get: function () {

					return this.uniforms.dashScale.value;

				},

				set: function ( value ) {

					this.uniforms.dashScale.value = value;

				}

			},

			dashSize: {

				enumerable: true,

				get: function () {

					return this.uniforms.dashSize.value;

				},

				set: function ( value ) {

					this.uniforms.dashSize.value = value;

				}

			},

			dashOffset: {

				enumerable: true,

				get: function () {

					return this.uniforms.dashOffset.value;

				},

				set: function ( value ) {

					this.uniforms.dashOffset.value = value;

				}

			},

			gapSize: {

				enumerable: true,

				get: function () {

					return this.uniforms.gapSize.value;

				},

				set: function ( value ) {

					this.uniforms.gapSize.value = value;

				}

			},

			opacity: {

				enumerable: true,

				get: function () {

					return this.uniforms.opacity.value;

				},

				set: function ( value ) {

					this.uniforms.opacity.value = value;

				}

			},

			resolution: {

				enumerable: true,

				get: function () {

					return this.uniforms.resolution.value;

				},

				set: function ( value ) {

					this.uniforms.resolution.value.copy( value );

				}

			},

			scaleLinewidth: {

				enumerable: true,

				get: function () { return this.defined.CV_SCALEWIDTH; },

				set: function ( value ) {

					this.defines.CV_SCALEWIDTH = value;
					this.needsUpdate = true;

				}

			}

		} );

		this.onResize = ( e ) => {

			const lineScale = e.lineScale ? e.lineScale : 1;

			this.resolution = new Vector2( e.width, e.height );
			this.linewidth = Math.max( 1, Math.floor( e.width / 1000 ) * lineScale );

		};

		this.setValues( params );

		this.resolution = new Vector2( ctx.container.clientWidth, ctx.container.clientHeight );

		ctx.viewer.addEventListener( 'resized', this.onResize );

	}

	dispose () {

		this.ctx.viewer.removeEventListener( 'resized', this.onResize );
		super.dispose();

	}

}

Line2Material.prototype.isLineMaterial = true;

export { Line2Material };