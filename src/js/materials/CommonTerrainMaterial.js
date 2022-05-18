import { EqualStencilFunc, MeshLambertMaterial } from '../Three';

class CommonTerrainMaterial extends MeshLambertMaterial {

	constructor ( ctx, parameters ) {

		super( parameters );

		Object.defineProperty( this, 'opacity', {
			get: function () { return ctx.materials.terrainOpacity; }
		} );

		this.stencilWrite = true;
		this.stencilFunc = EqualStencilFunc;

	}

	editShader ( shader, vertexPars, vertexMain, fragmentPars, fragmentColor ) {

		const vertexShader = shader.vertexShader
			.replace( '#include <common>', '$&\n' + vertexPars )
			.replace( 'include <begin_vertex>', '$&\n' + vertexMain );

		const fragmentShader = shader.fragmentShader
			.replace( '#include <common>', '$&\n' + fragmentPars )
			.replace( '#include <color_fragment>', fragmentColor );

		shader.vertexShader = vertexShader;
		shader.fragmentShader = fragmentShader;

	}

	editShaderInclude( shader, name ) {

		const start = '#include <' + name;
		this.editShader(
			shader,
			start + '_vertex_pars>',
			start + '_vertex>',
			start + '_fragment_pars>',
			start + '_fragment>'
		);

	}

}

export { CommonTerrainMaterial };