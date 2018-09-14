
import { Viewer } from '../viewer/Viewer';
import { Panel } from './Panel';


const annotators = [
	'none',
	'image',
	'link'
];

function AnnotatePanel ( page ) {

	Panel.call( this, page );

	const self = this;

	this.add( page.addHeader( 'annotate.header' ) );

	page.addListener( Viewer, 'selectedAnnotation', _onSelect );

	return this;

	function _onSelect ( event ) {

		self.onShow();

		const annotationInfo = event.annotationInfo;

		var annotation = annotationInfo.annotation;

		if ( annotation === undefined ) {

			annotation = {
				type: 'none'
			};

		}

		console.log( 'annot: ', annotation );

		self.addDynamic( page.addLine( annotationInfo.name ) );
		self.addDynamic( page.addSelect( 'annotate.type', annotators, annotation, 'type' ) );

		self.addDynamic( page.addButton( 'annotate.set', function () {
			console.log( 'set annotation: ', annotation );
			event.add( annotation );
			self.onShow();
		} ) );

	}

}

AnnotatePanel.prototype = Object.create( Panel.prototype );


export { AnnotatePanel };


// EOF