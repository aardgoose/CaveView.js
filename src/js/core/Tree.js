//"use strict";

var CV = CV || {};

CV.TreeNode = function ( name, id, parent ) {

	this.name     = name;
	this.id       = id;
	this.parent   = parent;
	this.children = [];

}

CV.Tree = function () {

	this.root  = new CV.TreeNode( "", 0, 0 );
	this.maxId = 0;

}

CV.Tree.prototype.constructor = CV.Tree;

CV.Tree.prototype.addNodeById = function ( name, id, parentId ) {

	var pnode = this.findById( parentId, this.root );

	if ( pnode ) {

		pnode.children.push ( new CV.TreeNode( name, id ) );
		this.maxId = Math.max( this.maxId, id );

		return id;

	}

	return null;

}

CV.Tree.prototype.addNode = function ( name, parentId ) {

	return this.addNodeById( name, ++this.maxId, parentId );

}

CV.Tree.prototype.findById = function ( id, node ) {

	if ( node === undefined ) node = this.root;

	if ( node.id == id ) return node;

	for ( var i = 0, l = node.children.length; i < l; i++ ) {

		var found = this.findById( id, node.children[ i ] );

		if ( found ) return found;

	}

	return false;

}

CV.Tree.prototype.makeTop = function ( id ) {

	var node = this.findById( id );
	this.root = node;

}

CV.Tree.prototype.addByPath = function ( path, node ) {

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

		var next = new CV.TreeNode( name, ++this.maxId, here.id );

		here.children.push( next );  

	}

	if ( path.length ) {

		return this.addByPath( path, next );

	} else {

		return next.id;

	}

}

CV.Tree.prototype.forNodes = function ( doFunc, node ) {

	var root = null;

	if ( node ) {

		root = node;

	} else {

		root = this.root;

	}

	doFunc( root );

	for (var i = 0, l = root.children.length; i < l; i++) {

		this.forNodes(doFunc, root.children[ i ]);

	}

}

CV.Tree.prototype.removeNodes = function ( doFunc, node ) {

	var root = null;

	if (node) {

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

CV.Tree.prototype.getSubtreeIds = function ( id, idSet, node ) {

	var root;

	if (!node) {

		root = this.findById( id, this.root );

	} else {

		root = node;

	}

	idSet.add( root.id );

	for ( var i = 0, l = root.children.length; i < l; i++ ) {

		this.getSubtreeIds( id, idSet, root.children[ i ] );

	}

}

CV.Tree.prototype.reduce = function ( name ) {

	// remove single child nodes from top of tree.
	while ( this.root.children.length === 1 ) {

		this.root = this.root.children[ 0 ];

	}

	if ( !this.root.name ) {

		this.root.name = name;

	}

}

CV.Tree.prototype.getRootId = function () {

	return this.root.id;

}

CV.Tree.prototype.getNodeData = function ( id ) {

	var node = this.findById( id, this.root );

	return { name: node.name, id: node.id, noChildren: node.children.length };

}

CV.Tree.prototype.getChildData = function ( id ) {

	var node = this.findById( id, this.root );
	var ret = [];

	for ( var i = 0, l = node.children.length; i < l; i++ ) {

		var child = node.children[ i ];

		ret.push( { name: child.name, id: child.id, noChildren: child.children.length } );

	}

	return ret;

}

CV.Tree.prototype.getIdByPath = function ( path ) {

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


// EOF