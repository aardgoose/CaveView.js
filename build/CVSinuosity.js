class Sinuosity {

	constructor ( viewer ) {

		this.viewer = viewer;

		this.show();
	}

	show () {

		this.close();

		const viewer = this.viewer;
		const colours = [ 'darkred', 'orangered', 'orange', 'yellow', 'blue' ];

		viewer.forEachLeg( leg => {

			const segment = leg.segment();
			const sin = ( segment.length() / segment.directDistance() ) - 1;

			leg.color( colours[ Math.round( sin * 2 ) ] );


		} );

		viewer.shadingMode = CV2.SHADING_CUSTOM;
		viewer.renderView();

	}

	close () {

	}

}