
const terrainLib = {

	onBeforeRender: function ( renderer ) {

		const stencil = renderer.state.buffers.stencil;
		const gl = renderer.context;

		stencil.setTest( true );

		stencil.setOp( gl.KEEP, gl.KEEP, gl.KEEP );
		stencil.setFunc( gl.EQUAL, 0, 0xFFFF );

	},

	onAfterRender: function ( renderer ) {

		const stencil = renderer.state.buffers.stencil;

		stencil.setTest( false );

	}

};

export { terrainLib };
