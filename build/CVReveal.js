
class Reveal {

	constructor ( viewer ) {

		this.viewer = viewer;
		this.legs = [];
	}

	show ( event ) {

		this.close();

		const legs = this.legs;
		const viewer = this.viewer;

		event.station.forEachConnectedLeg( leg => {
			leg.color( 'black' );
			legs.push( leg );
		} );

		viewer.shadingMode = CV2.SHADING_CUSTOM;
		viewer.renderView();

		function doAnimate () {

			if ( legs.length > 0 ) {

				legs.shift().color( 'yellow' );
				viewer.renderView();
				window.requestAnimationFrame( doAnimate );

			}

		}

		window.requestAnimationFrame( doAnimate );

	}

	close () {

		this.legs = [];

	}

}