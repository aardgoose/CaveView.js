
var terrainLib = {

	onBeforeRender: function ( renderer ) {

		var stencil = renderer.state.buffers.stencil;
		var gl = renderer.context;

		stencil.setTest( true );

		stencil.setOp( gl.KEEP, gl.KEEP, gl.KEEP );
		stencil.setFunc( gl.EQUAL, 0, 0xFFFF );

	},

	onAfterRender: function ( renderer ) {

		var stencil = renderer.state.buffers.stencil;

		stencil.setTest( false );

	}

};

export { terrainLib };
