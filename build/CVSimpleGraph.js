
class SimpleGraph {

	constructor ( id ) {

		this.id = id;
		this.cy = null;

	}

	show( event ) {

		this.close();

		const nodes = [];
		const elements = [];
		const stations = [];

		event.getStations( stationInfo => stations[ stationInfo.id ] = stationInfo );
		event.getLegs( ( l ) => {

			const v1 = l.v1;
			const v2 = l.v2;

			if ( nodes[ v1.id ] == undefined ) {

				nodes[ v1.id ] = [ v2.id ];

			} else {

				nodes[ v1.id ].push( v2.id );

			}

			if ( nodes[ v2.id ] == undefined ) {

				nodes[ v2.id ] = [ v1.id ];

			} else {

				nodes[ v2.id ].push( v1.id );

			}

		});

		nodes.forEach( ( n, i ) => {

			if ( n.length == 2 ) {

				const prev = n[ 0 ];
				const next = n[ 1 ];

				// edit out nodes with exactly two connections
				nodes[ prev ] = nodes[ prev ].map( e => e == i ? next : e );
				nodes[ next ] = nodes[ next ].map( e => e == i ? prev : e );

				n.length = 0;

			}

		} );

		let id = 0;

		nodes.forEach( ( n, i ) => {

			if ( n.length !== 0 ) {

				addNode( i );

				n.forEach( j => {

					addNode( j );

					elements.push( {
						data: {
							id: 'id' + id++,
							source: 'a' + i,
							target: 'a' + j,
						}
					} );

					nodes[ j ] = nodes[ j ].filter( k => k != i );

				} );
			}
		} );

		console.log( 'starting graph plot' );

		this.cy = cytoscape( {

			container: document.getElementById( this.id ),

			elements: elements,

			style: [
				{
					selector: 'node',
					style: {
						'background-color': 'blue',
//						'label': 'data(name)',
						'label': '',
						'color': 'black',
						'width': 8,
						'height': 8
					}
				},

				{
					selector: 'edge',
					style: {
						'width': 1,
						'line-color': '#444444',
//						'curve-style': ''
					}
				},
				{
					selector: '#a' + event.id,
					style: {
						'background-color': 'red'
					}
				}
			],

			layout: {
				name: 'cose'
			}

		} );

		this.cy.on( 'tap', 'node', e => console.log( e.target.data( 'name' ) ) );

		function addNode( id ) {

			const station = stations[ id ];
			const p =  station.coordinates;

			elements.push( {
				data: { id: 'a' + id, name: station.name },
				position: { x: p.x, y: -p.y }
			} );

		}

	}

	close () {

		if ( this.cy ) {

			this.cy.destroy();
			this.cy = null;

		}

	}

}