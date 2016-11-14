

function Tree( name, id, root, parent ) { // root parameter only used internally

	if ( root === undefined ) {

		this.id = 0;
		this.maxId = 0;
		this.root = this;
		this.parent = null;

	} else {

		this.root = root;
		this.parent = parent;
		this.id =  ( id === null ) ? ++root.maxId : id;

	}

	this.name     = name || "";
	this.children = [];

}

Tree.prototype.constructor = Tree;

Tree.prototype.traverse = function ( func ) {

	var children = this.children;

	func ( this );

	for ( var i = 0; i < children.length; i++ ) {

		children[ i ].traverse( func );

	}

}

Tree.prototype.forEachChild = function ( func, recurse ) {

	var children = this.children;
	var child;

	for ( var i = 0; i < children.length; i++ ) {

		child = children[ i ];

		func( child );
		if ( recurse === true ) child.forEachChild( func, true );

	}

}

Tree.prototype.addById = function ( name, id, parentId, properties ) {

	var parentNode = this.findById( parentId );

	if ( parentNode ) {

		var node = new Tree( name, id, this.root, this );

		if ( properties !== undefined ) Object.assign( node, properties );

		parentNode.children.push ( node );

		var root = this.root;		
		root.maxId = Math.max( root.maxId, id );

		return id;

	}

	return null;

}

Tree.prototype.findById = function ( id ) {

	if ( this.id == id ) return this;

	for ( var i = 0, l = this.children.length; i < l; i++ ) {

		var child = this.children[ i ];

		var found = child.findById( id );

		if ( found ) return found;

	}

	return undefined;

}

Tree.prototype.getByPath = function ( path ) {

	var node  = this;
	var search = true;

	while ( search && path.length > 0 ) {

		search = false;

		for ( var i = 0, l = node.children.length; i < l; i++ ) {

			var child = node.children[ i ];

			if ( child.name === path[ 0 ] ) {

				node = child;
				path.shift();
				search = true;

				break;

			}

		}

	}

	return node;

}

Tree.prototype.addPath = function ( path, properties ) {

	var node = this;
	var newNode;

	// find part of path that exists already

	node = this.getByPath( path );

	if ( path.length === 0 ) return node.id;

	// add remainder of path to node

	while ( path.length > 0 ) {

		newNode = new Tree( path.shift(), null, this.root, node );

		node.children.push( newNode );
		node = newNode;

	}

	if ( properties !== undefined ) Object.assign( node, properties );

	return node.id;

}

Tree.prototype.getSubtreeIds = function ( id, idSet ) {

	var node = this.findById( id );

	node.traverse( _getId );

	function _getId( node ) {

		idSet.add( node.id );

	}

}

Tree.prototype.reduce = function ( name ) {

	var node = this;

	// remove single child nodes from top of tree.
	while ( node.children.length === 1 ) node = node.children[ 0 ];

	if ( !node.name ) node.name = name;

	return node;

}

Tree.prototype.getIdByPath = function ( path ) {

	var node = this.getByPath ( path );

	if ( path.length === 0 ) {

		return node.id;

	} else {

		return undefined;

	}

}

export { Tree };

// EOF