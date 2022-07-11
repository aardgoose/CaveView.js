import { IncrementStencilOp } from '../Three';
import { FEATURE_SELECTED_BOX } from '../core/constants';
import { SurveyBox } from '../core/SurveyBox';

class Selection extends SurveyBox {

	constructor ( ctx, color ) {

		const survey = ctx.survey;

		let root = survey.surveyTree;
		let selectedNode = root;

		super( ctx, root.boundingBox, color );

		const material = this.material;

		material.stencilWrite = true;
		material.stencilZPass = IncrementStencilOp;

		this.layers.set( FEATURE_SELECTED_BOX );

		survey.addStatic( this );

		const selectedSectionIds = new Set();

		this.setRoot = function ( rootNode ) {

			root = rootNode;

		};

		this.set = function ( node ) {

			selectedNode = node;
			selectedSectionIds.clear();

			if ( selectedNode === root ) {

				this.visible = false;

			} else {

				node.getSubtreeIds( selectedSectionIds );
				this.visible = true;

				if ( ! node.isStation() && node.boundingBox !== undefined ) {

					this.update( node.boundingBox );

				}

			}

		};

		this.getByName = function ( name ) {

			return root.getByPath( name ) || root;

		};

		this.getIds = function () {

			return selectedSectionIds;

		};

		this.isEmpty = function () {

			return ( selectedNode === root );

		};

		this.contains = function ( id ) {

			return ( selectedNode === root || selectedSectionIds.has( id ) );

		};

		this.getWorldBoundingBox = function () {

			if ( this.isEmpty() ) {

				return survey.getWorldBoundingBox();

			} else {

				if ( ! selectedNode.worldBoundingBox ) selectedNode.updateWorld( survey.matrixWorld );
				return selectedNode.worldBoundingBox;

			}

		};

		this.getName = function () {

			return this.isEmpty() ? '' : selectedNode.getPath();

		};

		this.getNode = function () {

			return selectedNode;

		};

		this.isStation = function () {

			return selectedNode.isStation();

		};

	}

}

export { Selection };