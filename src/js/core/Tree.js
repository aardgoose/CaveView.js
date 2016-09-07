

function TreeNode( name, id, parent ) {

	this.name     = name;
	this.id       = id;
	this.parent   = parent;
	this.children = [];

}

function Tree () {

	this.root  = new TreeNode( "", 0, 0 );
	this.maxId = 0;

}

TreeNode.prototype.traverse = function ( func ) { // used - iinternal

	var children = this.children;

	func ( this );

	for ( var i = 0; i < children.length; i++ ) {

		children[ i ].traverse( func );

	}

}



Tree.prototype.constructor = Tree;

Tree.prototype.addNodeById = function ( name, id, parentId ) { // used

	var pnode = this.findById( parentId, this.root );

	if ( pnode ) {

		pnode.children.push ( new TreeNode( name, id ) );
		this.maxId = Math.max( this.maxId, id );

		return id;

	}

	return null;

}

Tree.prototype.findById = function ( id, node ) { // used - internal - horrible - convert to node method and slowly remove silly tree object.  worst code ive ever writtem IMHO

	if ( node === undefined ) node = this.root;

	if ( node.id == id ) return node;

	for ( var i = 0, l = node.children.length; i < l; i++ ) {

		var found = this.findById( id, node.children[ i ] );

		if ( found ) return found;

	}

	return false;

}

Tree.prototype.newTop = function ( id ) { //used

	var newTop = new Tree();

	var node = this.findById( id );
	newTop.root = node;

	return newTop;

}

Tree.prototype.addByPath = function ( path, node ) { // used = horrible

	var name = path.shift();
	var next = null;
	var here = null;

	if (node) {

		here = node;

	} else {

		here = this.root;

		if ( name === here.name && path.length === 0 ) {

			return here.id;

		}

	}

	for ( var i = 0, l = here.children.length; i < l; i++ ) {

		var child = here.children[ i ];

		if ( child.name === name ) {

			next = child;

			break;

		}

	}

	if ( next === null ) {

		var next = new TreeNode( name, ++this.maxId, here.id );

		here.children.push( next );

	}

	if ( path.length ) {

		return this.addByPath( path, next );

	} else {

		return next.id;

	}

}

Tree.prototype.getSubtreeIds = function ( id, idSet ) { //used

	var root = this.findById( id, this.root );

	root.traverse( _getId );

	function _getId( node ) {

		idSet.add( node.id );

	}

}

Tree.prototype.reduce = function ( name ) { // used

	// remove single child nodes from top of tree.
	while ( this.root.children.length === 1 ) {

		this.root = this.root.children[ 0 ];

	}

	if ( !this.root.name ) {

		this.root.name = name;

	}

}

Tree.prototype.getRootId = function () { // used

	return this.root.id;

}

Tree.prototype.getNodeData = function ( id ) { // used 

	var node = this.findById( id, this.root );

	return { name: node.name, id: node.id, noChildren: node.children.length };

}

Tree.prototype.getChildData = function ( id ) { // used

	var node = this.findById( id, this.root );
	var ret = [];

	for ( var i = 0, l = node.children.length; i < l; i++ ) {

		var child = node.children[ i ];

		ret.push( { name: child.name, id: child.id, noChildren: child.children.length } );

	}

	return ret;

}

Tree.prototype.getIdByPath = function ( path ) { // used

	var head;
	var node  = this.root;
	var found = true;

	if ( path.length === 0 ) return false;

	// the root node is unnamed at this point
	node = this.root;

	while ( path.length && found ) {

		head = path.shift();
		found = false;

		for ( var i = 0, l = node.children.length; i < l; i++ ) {

			var child = node.children[ i ];

			if ( child.name == head ) {

				node = child;
				found = node.id;

				break;

			}

		}

	}

	return found;

}

export { Tree };

// EOF