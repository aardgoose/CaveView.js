class Connected {

	constructor ( viewer ) {

		this.viewer = viewer;

		this.show();
	}

	show () {

		this.close();

		const viewer = this.viewer;
		const seen = new Set();
		const colours = [ 'red', 'blue', 'orange', 'lime', 'gray', 'magenta', 'white', 'pink', 'green', 'cyan', 'purple', 'orangered', 'springgreen' ];

		let group = 0;

		viewer.forEachStation( station => {

			if ( seen.has( station ) ) return;

			const colour = colours[ group++ % colours.length ];

			station.forEachConnectedLeg( leg => {

				const v1 = leg.start();
				const v2 = leg.end();

				if ( ! seen.has( v1 ) ) seen.add( v1 );
				if ( ! seen.has( v2 ) ) seen.add( v2 );

				leg.color( colour );

			} );

			viewer.shadingMode = CV2.SHADING_CUSTOM;
			viewer.renderView();

		} );




	}

	close () {

	}

}