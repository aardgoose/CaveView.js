import { simple } from 'acorn-walk';
import { traverse } from 'estree-toolkit';

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


//				simple( ast, {
				traverse( ast, {

					$: { scope: true },

					ImportSpecifier ( nodepath ) {

						const node = nodepath.node;

						// track file's current imports
						currentImports[ node.imported.name ] = true;

					},

					CallExpression ( nodepath ) {

						const node = nodepath.node;

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

							console.log( "\n\nfile:", fileName, "\nprop:", propertyName, "\n" ,nodepath.scope );
							console.log( "\nparent", nodepath.parent);

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