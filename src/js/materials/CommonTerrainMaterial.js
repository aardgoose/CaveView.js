import { EqualStencilFunc, MeshLambertMaterial } from '../Three';

class CommonTerrainMaterial extends MeshLambertMaterial {

	constructor ( ctx, parameters ) {

		super( parameters );

		Object.defineProperty( this, 'opacity', {
			get: function () { return ctx.materials.terrainOpacity; }
		} );

		this.transparent = true;
		this.stencilWrite = true;
		this.stencilFunc = EqualStencilFunc;

	}

	commonBeforeCompile( ctx, shader ) {

		return;

		Object.assign(
			shader.uniforms,
			ctx.materials.uniforms.location
		);

		this.editFragmentShader(
			shader,
			'#include <location_fragment_pars>',
			'#include <location_fragment>'
		);

	}

	editVertexShader ( shader, vertexPars, vertexMain ) {

		const vertexShader = shader.vertexShader
			.replace( '#include <common>', '$&\n' + vertexPars )
			.replace( 'include <begin_vertex>', '$&\n' + vertexMain );

		shader.vertexShader = vertexShader;
	}

	editFragmentShader ( shader, fragmentPars, fragmentColor ) {

		const fragmentShader = shader.fragmentShader
			.replace( '#include <common>', '$&\n' + fragmentPars )
			.replace( '#include <color_fragment>', fragmentColor );

		shader.fragmentShader = fragmentShader;

	}

	editShaderInclude( shader, name ) {

		const start = '#include <' + name;

		this.editVertexShader(
			shader,
			start + '_vertex_pars>',
			start + '_vertex>'
		);

		this.editFragmentShader(
			shader,
			start + '_fragment_pars>',
			start + '_fragment>'
		);

	}

}

export { CommonTerrainMaterial };