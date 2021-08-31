
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
						color: 'white',
						display: true
					}
				}
			}
		};

		event.getLegs( ( legInfo ) => {

			const v1 = legInfo.v1;
			const v2 = legInfo.v2;

			const dX = v1.coordinates.x - v2.coordinates.x;
			const dY = ( v1.coordinates.y - v2.coordinates.y) * Math.sign( dX );

			const l = Math.hypot( dX, dY );

			if ( l == 0 ) return;

			const a = 180 * Math.acos( dY / Math.hypot( dX, dY ) ) / Math.PI;

			sections[ Math.floor( a / this.sectorSize ) % sectorCount ] += l;

		} );

		const dataset = config.data.datasets[0];

		dataset.data = sections.concat( sections );

		config.data.datasets[0].backgroundColor = this.colours.slice( 0, sectorCount );

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