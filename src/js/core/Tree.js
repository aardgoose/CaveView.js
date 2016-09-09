


var maxId = -1;

function Tree( name, id ) {

	this.name     = name || "";
	this.id       = id || maxId++;
	this.children = [];

}

Tree.prototype.constructor = Tree;

Tree.prototype.traverse = function ( func ) { // internal

	var children = this.children;

	func ( this );

	for ( var i = 0; i < children.length; i++ ) {

		children[ i ].traverse( func );

	}

}

Tree.prototype.addById = function ( name, id, parentId ) {

	var parentNode = this.findById( parentId );

	if ( parentNode ) {

		parentNode.children.push ( new Tree( name, id ) );
		maxId = Math.max( maxId, id );

		return id; // why return this - we passed this in.

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

Tree.prototype.findPartialPath = function ( path ) { /* reuse in addByPath and findIdbyPath  */ }

Tree.prototype.addPath = function ( path ) {

	var node = this;
	var search = true;
	var i, child;

	while ( search && path.length > 0 ) {

		search = false;

		for ( i = 0; i < node.children.length; i++ ) {

			var child = node.children[ i ];

			if ( child.name === path[ 0 ] ) {

					// we have found the next path element

					path.shift();
					node = child;
					search = true;

					break;
			}

		}

	}

	if ( path.length === 0 ) return node.id;

	// add remainder of path to node

	while ( path.length > 0 ) {

		var newNode = new Tree( path.shift() );

		node.children.push( newNode );
		node = newNode;

	}

	return newNode.id;

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

	var node  = this;
	var search = true;
	var id;

	while ( search && path.length > 0 ) {

		search = false;

		for ( var i = 0, l = node.children.length; i < l; i++ ) {

			var child = node.children[ i ];

			if ( child.name === path[ 0 ] ) {

				node = child;
				path.shift();
				search = true;

				if ( path.length === 0 ) id = node.id;

				break;

			}

		}

	}

	return id;

}

export { Tree };

// EOF