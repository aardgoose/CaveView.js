
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

		const cy = cytoscape( {

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
						'width': 3,
						'line-color': '#000000',
						//	'mid-target-arrow-color': '#00ff00',
						//	'mid-target-arrow-shape': 'triangle',
						'curve-style': 'haystack'
					}
				},
				{
					selector: 'edge[cluster = 0]',
					style: {
						'line-color': '#880088',
					}
				},
				{
					selector: 'edge[cluster = 1]',
					style: {
						'line-color': '#008800',
					}
				},
				{
					selector: 'edge[cluster = 2]',
					style: {
						'line-color': '#008888',
					}
				},
				{
					selector: 'node[entrance = "y"]',
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
				// name: 'cose',
				// idealEdgeLength: function ( edge ) { return edge.data( 'length' ); }
			}

		} );

		const clusters = cy.nodes().kMeans( { attributes: [ ( function ( n ) { return n.data( 'height' ); } ) ], k: 3 } );

		clusters.forEach( ( eles, i ) => { eles.data( 'cluster', i ); console.log( 'cc' + i ); } );

		cy.elements( 'edge' ).forEach( e => e.data( 'cluster', Math.min( e.source().data( 'cluster' ), e.target().data( 'cluster' ) ) ) );

		cy.nodes( '[cluster = 0]' ).shift( 'y', 5 );
		cy.nodes( '[cluster = 2]' ).shift( 'y', -5 );

		cy.on( 'tap', 'node', e => console.log( e.target.data( 'name' ) ) );

		this.cy = cy;

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

			// quantise coordinates
			p.x = Math.round( p.x / 50 ) * 50;
			p.y = Math.round( p.y / 50 ) * 50;
			p.z = Math.round( p.z / 50 ) * 50;

			elements.push( {
				data: {
					id: 'a' + id,
					name: station.name(),
					'entrance': station.isEntrance() ? 'y' : 'n',
					'height': p.z
				},
				position: { x: p.x, y: -p.y }
			} );

			return station;

		}

		function distance( s1, s2 ) {

			return ( s1.coordinates().z + s2.coordinates().z ) / 2;
//			return s1.coordinates().distanceTo( s2.coordinates() );

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