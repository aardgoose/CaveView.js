

const StencilLib = {

	featureShowThrough: true,

	featureOnBeforeRender: function ( renderer ) {

		if ( ! StencilLib.featureShowThrough ) return;

		const stencil = renderer.state.buffers.stencil;
		const gl = renderer.context;

		stencil.setTest( true );

		stencil.setOp( gl.KEEP, gl.KEEP, gl.INCR );
		stencil.setFunc( gl.ALWAYS );

	},

	featureOnAfterRender: function ( renderer ) {

		if ( ! StencilLib.featureShowThrough ) return;

		const stencil = renderer.state.buffers.stencil;

		stencil.setTest( false );


	},

	terrainOnBeforeRender: function ( renderer ) {

		if ( ! StencilLib.featureShowThrough ) return;

		const stencil = renderer.state.buffers.stencil;
		const gl = renderer.context;

		stencil.setTest( true );
		stencil.setOp( gl.KEEP, gl.KEEP, gl.KEEP );
		stencil.setFunc( gl.EQUAL, 0, 0xFFFF );

	},

	terrainOnAfterRender: function ( renderer ) {

		if ( ! StencilLib.featureShowThrough ) return;

		const stencil = renderer.state.buffers.stencil;

		stencil.setTest( false );

	}

};

export { StencilLib };
