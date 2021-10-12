import { FEATURE_SELECTED_BOX } from '../core/constants';
import { SurveyBox } from '../core/SurveyBox';

import { Box3, IncrementStencilOp } from '../Three';

class Selection extends SurveyBox {

	constructor ( ctx, color ) {

		const survey = ctx.survey;
		const worldBoundingBox = new Box3();

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

				return worldBoundingBox.copy( selectedNode.boundingBox ).applyMatrix4( survey.matrixWorld );

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