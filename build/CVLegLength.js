
class LegLengthChart {

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
		this.sumLength = options.sumLength ?? false;
		this.clipTop = options.clipTop ?? 5;

	}

	show ( event ) {

		this.close();

		const sections = [];
		const labels = [];

		const config = {
			type: 'bar',
			data: {
				datasets: [ {
					data: sections,
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
						text: this.sumLength ? 'Total length by leg length ' : 'Leg count by leg length',
						display: true,
						color: 'black'
					}
				}
			}
		};

		event.station.forEachConnectedLeg( leg => {

			const l = leg.length();
			const bucket = Math.floor( l );

			if ( sections[ bucket ] == undefined ) {

				sections[ bucket ] = 0;
				labels[ bucket ] = bucket;

			}

			sections[ bucket ] += this.sumLength ? l : 1;


		} );

		if ( this.clipTop ) {

			const clip = sections.reduce( ( a, b ) => a + b, 0 ) * this.clipTop / 100;

			while ( sections[ sections.length -1 ] < clip ) {

				sections.pop();
				labels.pop();

			}

		}

		config.data.datasets[0].backgroundColor = this.colours;

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