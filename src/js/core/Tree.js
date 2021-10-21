import { Box3 } from '../Three';

function Tree( name, id, root, parent ) { // root parameter only used internally

	if ( root === undefined ) {

		this.id = 0;
		this.maxId = 0;
		this.root = this;
		this.parent = null;
		this.pathCache = [];
		this.idCache = [];
	} else {

		this.root = root;
		this.parent = parent;
		this.id = ( id === null ) ? ++root.maxId : id;

		parent.children.push( this );

	}
	this.boundingBox = new Box3();
	this.name = name || '';
	this.children = [];
	this.type = 0;

}

Tree.prototype.sorted = false;

Tree.prototype.traverse = function ( func ) {

	func ( this );

	if ( this.children === undefined ) return;

	const children = this.children;

	for ( let i = 0; i < children.length; i++ ) {

		children[ i ].traverse( func );

	}

};

Tree.prototype.traverseDepthFirst = function ( func ) {

	const children = this.children;

	for ( let i = 0; i < children.length; i++ ) {

		children[ i ].traverseDepthFirst( func );

	}

	func( this );

};

Tree.prototype.forEachChild = function ( func ) {

	this.children.forEach( child => func( child ) );

};

Tree.prototype.addById = function ( name, id ) {

	const root = this.root;
	const node = new Tree( name, id, root, this );

	root.maxId = Math.max( root.maxId, id );
	this.root.idCache[ id ] = node;

	return node;

};

Tree.prototype.addPath = function ( path ) {

	// find part of path that exists already
	const pathArray = path.split( '.' );

	let node = this.getByPathArray( pathArray );

	// return node or add remainder of path to node

	while ( pathArray.length > 0 ) {

		const newNode = new Tree( pathArray.shift(), null, this.root, node );

		this.root.pathCache[ newNode.getPath() ] = newNode;
		node = newNode;

	}

	return node;

};

Tree.prototype.addLeaf = function ( path, type, leafNode, comments ) {

	const root = this.root;

	// common for all paths

	leafNode.root = root;
	leafNode.id = ++root.maxId;
	leafNode.type = type;

	if ( comments ) leafNode.comments = comments;

	// short cut for flat surveys with little tree structure
	if ( path.length === 1 ) {

		leafNode.name = path[ 0 ];
		leafNode.parent = this;

		this.children.push( leafNode );

		return leafNode;

	}

	// find part of path that exists already using cache

	const leaf = [];
	let node;

	while ( node === undefined && path.length > 1 ) {

		leaf.unshift( path.pop() );
		node = this.root.pathCache[ path.join( '.' ) ];

	}

	// we have a valid path - attach the leaf here

	if ( node !== undefined) {

		leafNode.name = leaf.join( '.' );
		leafNode.parent = node;
		node.children.push( leafNode );

		return leafNode;

	}

	// fallback in case path not created

	path = path.concat( leaf );

	node = this.getByPathArray( path );

	if ( path.length === 0 ) return node;

	// add remainder of path to node

	while ( path.length > 1 ) {

		const node = new Tree( path.shift(), null, this.root, node );

	}

	leafNode.name = path.shift();
	leafNode.parent = node;
	node.children.push( node );

	return leafNode;

};

Tree.prototype.addLeafById = function ( name, id, type, leafNode, comments ) {

	const root = this.root;

	leafNode.type = type;
	leafNode.name = name;
	leafNode.id = id;
	leafNode.parent = this;

	this.children.push( leafNode );

	if ( comments ) leafNode.comments = comments;

	root.maxId = Math.max( root.maxId, id );
	this.root.idCache[ id ] = leafNode;

	return leafNode;

};

Tree.prototype.findById = function ( id ) {

	if ( this.id === id ) return this;

	const node = this.root.idCache[ id ];
	if ( node !== undefined ) return node;

	for ( let i = 0, l = this.children.length; i < l; i++ ) {

		const found = this.children[ i ].findById( id );

		if ( found ) return found;

	}

	return undefined;

};

/*
Tree.prototype.getByPath = function ( path ) {

	const pathArray = path.split( '.' );
	const node = this.getByPathArray( pathArray );

	return ( pathArray.length === 0 ) ? node: undefined;

};
*/

Tree.prototype.getByPath = function ( path ) {

	if ( ! path )
		return undefined;

	const pathArray = path.split( '.' );

	let node = this.getByPathArray( pathArray );
	let pathArrayPos = undefined;

	if ( pathArray.length !== 0 )
	{
		const pathArrayEx = path.split( '.' );

		if ( pathArrayEx.length - 2 < 0 )
			return undefined;

		const pathArrayMainPath = pathArrayEx.slice( 0, pathArrayEx.length - 2 );
		const pathPosStation = pathArrayEx.slice( pathArrayEx.length - 2, pathArrayEx.length ).join( '.' );

		node = this.getByPathArray( pathArrayPos = pathArrayMainPath.concat( pathPosStation ) );
	}

	return ( ( pathArray.length === 0 ) || ( pathArrayPos.length === 0 ) ) ? node: undefined;

};

Tree.prototype.getByPathArray = function ( path ) {

	let node = this.root;
	let search = true;

	while ( search && path.length > 0 ) {

		search = false;

		for ( let i = 0, l = node.children.length; i < l; i++ ) {

			const child = node.children[ i ];

			if ( child.name === path[ 0 ] ) {

				node = child;
				path.shift();
				search = true;

				break;

			}

		}

	}

	return node;

};

Tree.prototype.getPath = function ( endNode ) {

	const path = [];

	let node = this;

	if ( endNode === undefined ) endNode = this.root;

	do {

		path.push( node.name );
		node = node.parent;

	} while ( node !== endNode && node !== null );

	return path.reverse().join( '.' );

};

Tree.prototype.getSubtreeIds = function ( idSet ) {

	this.traverse( _getId );

	function _getId( node ) {

		idSet.add( node.id );

	}

	return idSet;

};

Tree.prototype.getIdByPath = function ( path ) {

	const array = path.split( '.' );
	const node = this.getByPathArray( array );

	if ( array.length === 0 ) {

		return node.id;

	} else {

		return undefined;

	}

};

Tree.prototype.trim = function ( path ) {

	const prefix = path.shift();
	const children = this.children;

	let child;

	if ( prefix === undefined ) return;

	for ( let i = 0; i < children.length; i++ ) {

		child = children[ i ];

		if ( child.name === prefix ) break;

	}

	this.children = [ child ];

	child.trim( path );

};

Tree.prototype.isStation = function () {

	return ( this.type !== 0  );

};

export { Tree };