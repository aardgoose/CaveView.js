import { MeshBasicMaterial, Vector2 } from '../Three';
import { NodeMaterial, ShaderNode, positionGeometry, abs, shader, attribute, cond, discard, float, mix, mod, normalize, uniform, varying, vec2, vec3, vec4, modelViewMatrix, cameraProjectionMatrix, materialColor } from '../Nodes.js';

const defaultValues = new MeshBasicMaterial();

class Line2Material extends NodeMaterial {

	isLineMaterial = true;
	name = 'Line2Material';
	colorInsert = null;

	constructor ( params = {}, ctx ) {

		super( params );

		this.setDefaultValues( defaultValues );

		const linewidth  = uniform( 0.002, 'float' );
		const resolution = uniform( new Vector2( 1, 1 ), 'vec2' );

		const dashSize   = uniform( 0.1, 'float'  );
		const dashOffset = uniform( 0, 'float' );
		const gapSize    = uniform( 0.2, 'float'  );
		const opacity    = uniform( 1, 'float' );

		const USE_COLOR = params.vertexColors;
		const USE_DASH = params.dashed;

		const CV_CURSOR = false;
		const CV_DEPTH = false;
		const CV_DEPTH_CURSOR = false;
		const CV_Z = false;

		console.log( '***** dashed ******', USE_DASH );
		const trimSegment = new ShaderNode( ( start, end ) => {

			const a = cameraProjectionMatrix.element( 2 ).element( 2 ); // 3nd entry in 3th column
			const b = cameraProjectionMatrix.element( 3 ).element( 2 ); // 3nd entry in 4th column
			const nearEstimate = b.mul( -0.5 ).div( a );

			const alpha = nearEstimate.sub( start.z ).div( end.z.sub( start.z ) );

			end.xyz = mix( start.xyz, end.xyz, alpha );

		} );

		this.normals = false;
		this.lights = false;
		// this.isTest = true;

		const uv = attribute( 'uv', 'vec2' );
		const vUv = varying( uv );

		let vColor;

		if ( USE_COLOR ) {

			const instanceColorStart = attribute( 'instanceColorStart', 'vec3' );
			const instanceColorEnd = attribute( 'instanceColorEnd', 'vec3' );

			vColor = varying( positionGeometry.y.lessThan( 0.5 ).cond( instanceColorStart, instanceColorEnd ) );

		} else {

			vColor = materialColor;

		}

		let vLineDistance;

		if ( USE_DASH ) {

			const dashScale = uniform( 1.0, 'float' );
			const instanceDistanceStart = attribute( 'instanceDistanceStart', 'float' );
			const instanceDistanceEnd = attribute( 'instanceDistanceEnd', 'float' );

			vLineDistance = varying( positionGeometry.y.lessThan( 0.5 ).cond( dashScale.mul( instanceDistanceStart ), dashScale.mul( instanceDistanceEnd ) ) );

		}


		const vertexShaderNode = shader( ( stack ) => {

			const instanceStart = attribute( 'instanceStart', 'vec3' );
			const instanceEnd   = attribute( 'instanceEnd',  'vec3' );

			const aspect = resolution.x.div( resolution.y );
	
			// camera space
			const start = modelViewMatrix.mul( vec4( instanceStart, 1.0 ) );
			const end = modelViewMatrix.mul( vec4( instanceEnd, 1.0 ) );

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			const perspective = cameraProjectionMatrix.element( 2 ).element( 3 ).equal( -1.0 ); // 4th entry in the 3rd column

			stack.if( perspective, ( /* stack */ ) => {

				start.z.lessThan( 0.0 ).and( end.z.greaterThan( 0.0 ) ).cond(
					trimSegment.call( start, end ),
					end.z.lessThan( 0.0 ).and( start.z.greaterThanEqual( 0.0 ) ).cond( trimSegment.call( end, start ) )
				);

			} );

			// clip space
			const clipStart = cameraProjectionMatrix.mul( start );
			const clipEnd = cameraProjectionMatrix.mul( end );

			// ndc space
			const ndcStart = clipStart.xyz.div( clipStart.w );
			const ndcEnd = clipEnd.xyz.div( clipEnd.w );

			// direction
			const dir = ndcEnd.xy.sub( ndcStart.xy );

			// account for clip-space aspect ratio
			stack.assign( dir.x, dir.x.mul( aspect ) );
			stack.assign( dir, normalize( dir ) );

			let clip;
			let offset = vec2( dir.y, dir.x.negate() );

			// undo aspect ratio adjustment
			stack.assign( dir.x, dir.x.div( aspect ) );
			stack.assign( offset.x, offset.x.div( aspect ) );

			// sign flip
			stack.assign( offset, positionGeometry.x.lessThan( 0.0 ).cond( offset.negate(), offset ) );

			// endcaps
			stack.if( positionGeometry.y.lessThan( 0.0 ), (stack ) => {

				stack.assign( offset, offset.sub( dir ) );

			} ).elseif( positionGeometry.y.greaterThan( 1.0 ), ( stack ) => {

				stack.assign( offset, offset.add( dir ) );

			} );

			// adjust for linewidth
			stack.assign( offset, offset.mul( linewidth ) );

			// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
			stack.assign( offset, offset.div( resolution.y ) );

			// select end
			clip = cond( positionGeometry.y.lessThan( 0.5 ), clipStart, clipEnd );

			// back to clip space
			stack.assign( offset, offset.mul( clip.w ) );

			// --- this fails to compile ---
			//				stack.assign( clip.xy, clip.xy.add( offset ) );
			// --- this fails to compile ---

			stack.assign( clip, clip.add( vec4( offset, 0, 0 ) ) );

			return clip;

		} );

		const fragmentShaderNode = shader( ( stack ) => {

			//if ( vHide > 0.0 ) discard;

			if ( USE_DASH ) {

				stack.add( discard( vUv.y.lessThan( - 1.0 ).or( vUv.y.greaterThan( 1.0 ) ) ) ); // discard endcaps
				stack.add( discard( mod( vLineDistance.add( dashOffset ), dashSize.add( gapSize ) ).greaterThan( dashSize ) ) ); // todo - FIX

			}

			// round endcaps

			stack.if( abs( vUv.y ).greaterThan( 1.0 ), ( stack ) => {

				const a = vUv.x;
				const b = cond( vUv.y.greaterThan( 0.0 ),  vUv.y.sub( 1.0 ), vUv.y.add( 1.0 ) );
				const len2 = a.mul( a ).add( b.mul( b ) );

				stack.add( discard( len2.greaterThan( 1.0 ) ) );

			} );

			if ( this.colorInsert !== null ) {


				return vColor.mul( this.colorInsert );

			} else {

				return vColor;

			}

			if ( CV_DEPTH || CV_DEPTH_CURSOR ) {

//				float terrainHeight = unpackRGBAToFloat( texture2D( depthMap, vTerrainCoords ) );

				stack.assign( terrainHeight, terrainHeight.mul( rangeZ ).add( modelMin.z ).add( datumShift ) );

				const depth = terrainHeight.sub( vPosition.z );
				const vCursor = depth; // hack

			}

			if ( CV_DEPTH ) {

				return texture2D( cmap, vec2( depth * depthScale, 1.0 ) ) * vec4( vColor, 1.0 );

			}

			if ( CV_CURSOR || CV_DEPTH_CURSOR ) {

				// #include <cursor_fragment>

			}

			if ( CV_Z ) {

				return vec4( vFadeDepth, 0.0, 1.0 - vFadeDepth, diffuseColor.a );

			}

		} );

		this.outNode = vertexShaderNode;
		this.colorNode = fragmentShaderNode;

		this.dashed = false;
		this.ctx = ctx;
/*
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
*/


		this.onResize = ( e ) => {

			const lineScale = e.lineScale ? e.lineScale : 1;

			this.resolution = new Vector2( e.width, e.height );
			this.linewidth = Math.max( 1, Math.floor( e.width / 1000 ) * lineScale );

		};

		this.setValues( params );

		this.resolution = new Vector2( ctx.container.clientWidth, ctx.container.clientHeight );

		ctx.viewer.addEventListener( 'resized', this.onResize );

	}

	constructPosition( /* builder */ ) {

		return this.outNode;

	}

	customProgramCacheKey () {

		return this.name;

	}

	dispose () {

		this.ctx.viewer.removeEventListener( 'resized', this.onResize );
		super.dispose();

	}

}

export { Line2Material };