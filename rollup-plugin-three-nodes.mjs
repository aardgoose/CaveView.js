import { simple } from 'acorn-walk';

const nodeElements = {};

export default function threeNodes () {

	return {
		name: 'three-nodes', // this name will show up in logs and errors

		transform: {

			order: 'post',

			handler ( code, id ) {

				const fileName =  id.split( '\\' ).pop();

				// prevent creation of circular dependencies with spurious imports
				if ( fileName === 'ShaderNode.js' ) return null;

				const ast = this.parse( code );
				const newImports = [];
				const currentImports = {};

				simple( ast, {

					ImportSpecifier( node ) {

						// track file's current imports
						currentImports[ node.imported.name ] = true;

					},

					CallExpression ( node ) {

						if ( node.callee.type == 'Identifier' && node.callee.name == 'addNodeElement'  ) {

							nodeElements[ node.arguments[ 0 ].value ] = id;
							return;

						}

						if ( node.callee.type === 'MemberExpression' ) {

							const propertyName = node.callee.property.name;

							// don't duplicate imports
							if ( currentImports[ propertyName ] === true ) return;

							// exclude builtin Math.x methods
							if ( node.callee.object.name === 'Math' ) return;

							const moduleId = nodeElements[ propertyName ];

							if ( moduleId === undefined || typeof moduleId !== 'string' ) return;

							newImports.push( `import { ${propertyName} } from '${moduleId.replaceAll( '\\', '\/' ) }';` );
							newImports.push( `console.log( 'custard:', ${propertyName});` );

							delete nodeElements[ propertyName ];

						}

					}

				} );

				if ( newImports.length === 0 ) {

					return { code: code, ast: ast, map: null };

				} else {

					return newImports.join( "\n" ) +  "\n" + code;

				}

			},

		}

	};

}