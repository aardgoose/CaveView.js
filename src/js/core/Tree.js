

function Tree( name, id, root, parent ) { // root parameter only used internally

	if ( root === undefined ) {

		this.id = 0;
		this.maxId = 0;
		this.root = this;
		this.parent = null;
		this.pathCache = [];

	} else {

		this.root = root;
		this.parent = parent;
		this.id = ( id === null ) ? ++root.maxId : id;

	}

	this.name = name || '';
	this.children = [];

}

Tree.prototype.traverse = function ( func ) {

	const children = this.children;

	func ( this );

	for ( var i = 0; i < children.length; i++ ) {

		children[ i ].traverse( func );

	}

};

Tree.prototype.traverseDepthFirst = function ( func ) {

	const children = this.children;

	for ( var i = 0; i < children.length; i++ ) {

		children[ i ].traverseDepthFirst( func );

	}

	func ( this );

};

Tree.prototype.forEachChild = function ( func ) {

	const children = this.children;

	for ( var i = 0; i < children.length; i++ ) {

		func( children[ i ] );

	}

};

Tree.prototype.addById = function ( name, id, properties ) {

	const root = this.root;
	const node = new Tree( name, id, root, this );

	if ( properties !== undefined ) Object.assign( node, properties );

	this.children.push( node );

	root.maxId = Math.max( root.maxId, id );

	return node;

};

Tree.prototype.findById = function ( id ) {

	if ( this.id == id ) return this;

	for ( var i = 0, l = this.children.length; i < l; i++ ) {

		const found = this.children[ i ].findById( id );

		if ( found ) return found;

	}

	return undefined;

};

Tree.prototype.getByPath = function ( path ) {

	const pathArray = path.split( '.' );

	return pathArray.length === 0 ? this.getByPathArray( pathArray ) : undefined;

};

Tree.prototype.getByPathArray = function ( path ) {

	var node = this.root;
	var search = true;

	while ( search && path.length > 0 ) {

		search = false;

		for ( var i = 0, l = node.children.length; i < l; i++ ) {

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

Tree.prototype.addLeaf = function ( path, properties ) {

	// shor cut for flat surveys with little tree structure
	if ( path.length === 1 ) {

		const newNode = new Tree( path[ 0 ], null, this.root, this );

		if ( properties !== undefined ) Object.assign( newNode, properties );

		this.children.push( newNode );

		return newNode;

	}

	// find part of path that exists already using cache

	var node;
	var leaf = [];

	while ( node === undefined && path.length > 1 ) {

		leaf.unshift( path.pop() );
		node = this.root.pathCache[ path.join( '.' ) ];

	}

	// we have a valid path - attach the leaf here

	if ( node !== undefined) {

		const newNode = new Tree( leaf.join( '.' ), null, this.root, node );

		if ( properties !== undefined ) Object.assign( newNode, properties );

		node.children.push( newNode );

		return newNode;

	}

	// fallback in case path not created

	path = path.concat( leaf );

	node = this.getByPathArray( path );

	if ( path.length === 0 ) return node;

	// add remainder of path to node

	while ( path.length > 0 ) {

		const newNode = new Tree( path.shift(), null, this.root, node );

		node.children.push( newNode );

		node = newNode;

	}

	if ( properties !== undefined ) Object.assign( node, properties );

	return node;

};

Tree.prototype.addPath = function ( path ) {

	// find part of path that exists already
	var pathArray = path.split( '.' );

	var node = this.getByPathArray( pathArray );

	if ( pathArray.length === 0 ) return node;

	// add remainder of path to node

	while ( pathArray.length > 0 ) {

		const newNode = new Tree( pathArray.shift(), null, this.root, node );

		node.children.push( newNode );

		this.root.pathCache[ newNode.getPath() ] = newNode;

		node = newNode;

	}

	return node;

};

Tree.prototype.getPath = function ( endNode ) {

	const path = [];

	var node = this;

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

};

Tree.prototype.getIdByPath = function ( path ) {

	return this.getIdByPathArray( path.split( '.' ) );

};

Tree.prototype.getIdByPathArray = function ( array ) {

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

	var child;

	if ( prefix === undefined ) return;

	for ( var i = 0; i < children.length; i++ ) {

		child = children[ i ];

		if ( child.name === prefix ) break;

	}

	this.children = [ child ];

	child.trim( path );

};

export { Tree };

// EOF