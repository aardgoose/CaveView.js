
class SimpleGraph {

	constructor ( id ) {

		this.id = id;
		this.cy = null;

	}

	show( event ) {

		this.close();

		let nodes = [];
		const elements = [];
		const stations = [];

		const rootStation = event.station;

		stations[ rootStation.id() ] = rootStation;
		nodes[ rootStation.id() ] = rootStation.adjacentStationIds();

		event.station.forEachConnectedLeg( l => {

			const v2 = l.end();
			const v2Id = v2.id();

			stations[ v2Id ] = v2;

			nodes[ v2Id ] = v2.adjacentStationIds();

		} );

		// simplyfy network by merging linear sequences of legs

		mergeLegs( nodes );

		let id = 0;

		// prune single leg side passages
		nodes = pruneLegs( nodes );

		// set up data for graphing

		nodes.forEach( ( n, i ) => {

			if ( n.length !== 0 ) {

				const s1 = addStation( i );

				n.forEach( j => {

					const s2 = addStation( j );

					let source, target;

					if ( s1.shortestPathDistance() > s2.shortestPathDistance() ) {

						source = i;
						target = j;

					} else {

						source = j;
						target = i;

					}

					elements.push( {
						data: {
							id: 'id' + id++,
							source: 'a' + source,
							target: 'a' + target,
							length: distance( s1, s2 ),
						}
					} );

					// remove duplicate legs
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
						'mid-target-arrow-color': '#00ff00',
						'mid-target-arrow-shape': 'triangle',
						'curve-style': 'straight'
					}
				},
				{
					selector: 'node[?entrance]',
					style: {
						'background-color': 'green'
					}
				},
				{
					selector: '#a' + event.station.id(),
					style: {
						'background-color': 'red'
					}
				},
				{
					selector: 'node[[degree = 0]]',
					style: {
						'display': 'none'
					}
				}
			],

			layout: {
				name: 'preset',
//				name: 'cose',
//				idealEdgeLength: function ( edge ) { return edge.data( 'length' ); }
			}

		} );

		this.cy.on( 'tap', 'node', e => console.log( e.target.data( 'name' ) ) );

		function mergeLegs( nodes ) {

			// simplyfy network by merging linear sequences of legs

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

		}

		function addStation( id ) {

			const station = stations[ id ];
			const p =  station.coordinates();

			elements.push( {
				data: {
					id: 'a' + id,
					name: station.name(),
					'entrance': station.isEntrance()
				},
				position: { x: p.x, y: -p.y }
			} );

			return station;

		}

		function distance( s1, s2 ) {

			return s1.coordinates().distanceTo( s2.coordinates() );

		}

		function pruneLegs( nodes ) {

			return nodes.map( n => {

				const iConnections = n.length;

				if ( iConnections == 0 ) return n;

				return n.filter( j => {

					const jConnections = nodes[ j ].length;

					return (
						! ( iConnections == 1 && jConnections == 3 ) &&
						! ( jConnections == 1 && iConnections == 3 ) );

				} );

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