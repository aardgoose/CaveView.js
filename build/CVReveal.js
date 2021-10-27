
class Reveal {

	constructor ( viewer ) {

		this.viewer = viewer;
		this.legs = [];
		this.requestID = null;
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

		const doAnimate = () => {

			if ( legs.length > 0 ) {

				legs.shift().color( 'yellow' );
				viewer.renderView();
				this.requestID = window.requestAnimationFrame( doAnimate );

			}

		};

		this.requestID = window.requestAnimationFrame( doAnimate );

	}

	close () {

		if ( this.requestID ) window.cancelAnimationFrame( this.requestID );
		this.legs = [];

	}

}