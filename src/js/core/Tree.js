

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

Tree.prototype.constructor = Tree;

Tree.prototype.addNodeById = function ( name, id, parentId ) {

	var pnode = this.findById( parentId, this.root );

	if ( pnode ) {

		pnode.children.push ( new TreeNode( name, id ) );
		this.maxId = Math.max( this.maxId, id );

		return id;

	}

	return null;

}

Tree.prototype.addNode = function ( name, parentId ) {

	return this.addNodeById( name, ++this.maxId, parentId );

}

Tree.prototype.findById = function ( id, node ) {

	if ( node === undefined ) node = this.root;

	if ( node.id == id ) return node;

	for ( var i = 0, l = node.children.length; i < l; i++ ) {

		var found = this.findById( id, node.children[ i ] );

		if ( found ) return found;

	}

	return false;

}

Tree.prototype.newTop = function ( id ) {

	var newTop = new Tree();

	var node = this.findById( id );
	newTop.root = node;

	return newTop;

}

Tree.prototype.addByPath = function ( path, node ) {

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

Tree.prototype.forNodes = function ( doFunc, node ) {

	var root = null;

	if ( node ) {

		root = node;

	} else {

		root = this.root;

	}

	doFunc( root );

	for ( var i = 0, l = root.children.length; i < l; i++ ) {

		this.forNodes( doFunc, root.children[ i ] );

	}

}

Tree.prototype.removeNodes = function ( doFunc, node ) {

	var root = null;

	if ( node ) {

		root = node;

	} else {

		root = this.root;

	}

	for ( var i = 0, l = root.children.length; i < l; i++ ) {

		this.removeNodes( doFunc, root.children[ i ] );

	}

	doFunc( root );
	root.children = [];

}

Tree.prototype.getSubtreeIds = function ( id, idSet, node ) {

	var root;

	if ( !node ) {

		root = this.findById( id, this.root );

	} else {

		root = node;

	}

	idSet.add( root.id );

	for ( var i = 0, l = root.children.length; i < l; i++ ) {

		this.getSubtreeIds( id, idSet, root.children[ i ] );

	}

}

Tree.prototype.reduce = function ( name ) {

	// remove single child nodes from top of tree.
	while ( this.root.children.length === 1 ) {

		this.root = this.root.children[ 0 ];

	}

	if ( !this.root.name ) {

		this.root.name = name;

	}

}

Tree.prototype.getRootId = function () {

	return this.root.id;

}

Tree.prototype.getNodeData = function ( id ) {

	var node = this.findById( id, this.root );

	return { name: node.name, id: node.id, noChildren: node.children.length };

}

Tree.prototype.getChildData = function ( id ) {

	var node = this.findById( id, this.root );
	var ret = [];

	for ( var i = 0, l = node.children.length; i < l; i++ ) {

		var child = node.children[ i ];

		ret.push( { name: child.name, id: child.id, noChildren: child.children.length } );

	}

	return ret;

}

Tree.prototype.getIdByPath = function ( path ) {

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