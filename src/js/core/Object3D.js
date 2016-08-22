
import { Object3D }  from '../../../../three.js/src/Three.js';

Object.assign( Object3D.prototype, {

	reverseTraverse: function ( callback ) {

		var children = this.children;

		for ( var i = children.length; i--; ) {

			children[ i ].reverseTraverse( callback );

		}

		callback( this );

	}

}

);

// EOF