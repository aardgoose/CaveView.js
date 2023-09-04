import { simple } from 'acorn-walk';

const ss = {};

export default function ansTest () {

	return {
		name: 'my-example', // this name will show up in logs and errors

		transform: {
			order: 'post',
			handler ( code, id ) {


				const self = this;
				const ast = this.parse( code );
				const fixes = [];

				simple( ast, {

					CallExpression ( node ) {

						if ( node.callee.type == 'Identifier' && node.callee.name == 'addNodeElement'  ) {

							ss[ node.arguments[ 0 ].value ] = id;
							return;

						}

						if ( node.callee.type === 'MemberExpression' ) {

							const propertyName = node.callee.property.name;
							const moduleId = ss[ propertyName ];

							if ( moduleId === undefined ) return;

							const moduleInfo = self.getModuleInfo( moduleId );

							if ( moduleInfo === null ) return;

							if ( moduleInfo.moduleSideEffects ) return;

							fixes.push( `import { ${propertyName} } from '${moduleId.replaceAll( '\\', '\/' ) }';` );
							fixes.push( `console.log( 'custard:', ${propertyName});` );

							delete ss[ propertyName ];

						}

					}

				} );

				if ( fixes.length === 0 ) {

					return { code: code, ast: ast, map: null };

				} else {

					console.log( 'here ------------', fixes[ 0 ]);
					return fixes.join( "\n" ) +  "\n" + code;

				}

			},

		},
/*		moduleParsed ( moduleInfo ) {

			const self = this;

			simple( moduleInfo.ast, {

				CallExpression ( node ) {

					if ( node.callee.type == 'Identifier' && node.callee.name == 'addNodeElement'  ) {

						ss[ node.arguments[ 0 ].value ] = moduleInfo.id;
						return;

					}

					if ( node.callee.type === 'MemberExpression' ) {

						const propertyName = node.callee.property.name;
						const moduleId = ss[ propertyName ];

						if ( moduleId === undefined ) return;

						const moduleInfo = self.getModuleInfo( moduleId );

						if ( moduleInfo === null ) return;

						if ( moduleInfo.moduleSideEffects ) return;

						moduleInfo.moduleSideEffects = 'no-treeshake';
						const newModuleInfo = self.load( { id: `ans-${propertyName}`, resolveDependencies: true, moduleSideEffects: 'no-treeshake' } );
						newModuleInfo.then( i => {
							console.log( i );
							console.log( 'inc', i.isIncluded, i.importers );
						} );
						//						console.log( self.getModuleInfo( 'ans' ) );
//						delete ss[ propertyName ];

					}

				}

			} )

		}, */
		buildEnd () {

			for ( let i of this.getModuleIds() ) {

				if ( i === 'C:\\Users\\angus\\Documents\\CaveView.js\\node_modules\\three\\examples\\jsm\\nodes\\utils\\DiscardNode.js' || i === 'ans' ) {

					const m = this.getModuleInfo( i );
//					console.log( m );
					console.log( i, m.isIncluded );

				}

			}

		}

	};

}