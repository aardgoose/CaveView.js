import { simple } from 'acorn-walk';

const ss = {};

export default function ansTest () {

	return {
		name: 'my-example', // this name will show up in logs and errors

		transform: {
			order: 'post',
			handler ( code, id ) {

				const fileName =  id.split( '\\' ).pop();

				// prevent creation of circular dependencies with spurious imports
				if ( fileName === 'ShaderNode.js' ) return null;

				const self = this;
				const ast = this.parse( code );
				const fixes = [];
				const imports = {};

				simple( ast, {

					ImportSpecifier( node ) {

						imports[ node.imported.name ] = true;

					},

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

							if ( imports[ propertyName ] === true ) return;

							// exclude builtin Math.x methods
							if ( node.callee.object.name === 'Math' ) return;

							fixes.push( `import { ${propertyName} } from '${moduleId.replaceAll( '\\', '\/' ) }';` );
							fixes.push( `console.log( 'custard:', ${propertyName});` );

							delete ss[ propertyName ];

						}

					}

				} );

				if ( fixes.length === 0 ) {

					return { code: code, ast: ast, map: null };

				} else {

					return fixes.join( "\n" ) +  "\n" + code;

				}

			},

		},
		buildEnd () {

			for ( let i of this.getModuleIds() ) {

				if ( i === 'C:\\Users\\angus\\Documents\\CaveView.js\\node_modules\\three\\examples\\jsm\\nodes\\utils\\DiscardNode.js' || i === 'ans' ) {

					const m = this.getModuleInfo( i );
					console.log( i, m.isIncluded );

				}

			}

		}

	};

}