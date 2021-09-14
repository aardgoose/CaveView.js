
class RoseChart {

	constructor ( id, options = {} ) {

		const container = document.getElementById( id );

		if ( ! container ) {

			console.error( "missing container element" );
			return;

		}

		this.container = container;
		this.canvas = null;
		this.chart = null;
		this.colours = options.colours ?? [ 'red' ];
		this.sectorSize = options.sectorSize ?? 30;

	}

	show ( event ) {

		this.close();

		const sectorCount = 180 / this.sectorSize;
		const sections = [];
		const labels = [];

		for ( let i = 0; i < sectorCount; i++ ) {

			sections [ i ] = 0;
			labels[ i ] = i;

		}

		const config = {
			type: 'polarArea',
			data: {
				datasets: [ {
					data: [],
					backgroundColor: []
				} ],
				labels: labels
			},
			options: {
				layout: {
					padding: 2
				},
				plugins: {
					legend: {
						display: false
					},
					title: {
						text: 'Total Leg Length by Direction',
						color: 'black',
						display: true
					}
				}
			}
		};

		event.station.forEachConnectedLeg( leg => {

			const v1 = leg.start();
			const v2 = leg.end();

			const v1Coordinates = v1.coordinates();
			const v2Coordinates = v2.coordinates();

			const dX = v1Coordinates.x - v2Coordinates.x;
			const dY = ( v1Coordinates.y - v2Coordinates.y ) * Math.sign( dX );

			const l = Math.hypot( dX, dY );

			if ( l == 0 ) return;

			const a = 180 * Math.acos( dY / l ) / Math.PI;

			sections[ Math.floor( a / this.sectorSize ) % sectorCount ] += l;

		} );

		const dataset = config.data.datasets[0];

		dataset.data = sections.concat( sections ); // duplicate for symetrical rose
		dataset.backgroundColor = this.colours.slice( 0, sectorCount );

		const canvas = document.createElement( 'canvas' );

		this.container.appendChild( canvas );

		this.chart = new Chart( canvas, config );
		this.canvas = canvas;

	}

	close () {

		if ( this.chart ) this.chart.destroy();
		if ( this.canvas ) this.container.removeChild( this.canvas );
		this.chart = null;
		this.canvas = null;

	}

}