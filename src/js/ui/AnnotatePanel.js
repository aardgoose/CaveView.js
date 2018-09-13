
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
	const annotator = { type: 'none' };

	this.add( page.addHeader( 'annotate.header' ) );

	page.addListener( Viewer, 'selectedAnnotation', _onSelect );

	return this;

	function _onSelect ( event ) {

		self.onShow();

		self.addDynamic( page.addLine( event.station ) );
		self.addDynamic( page.addSelect( 'annotate.type', annotators, annotator, 'type' ) );

		self.addDynamic( page.addButton( 'annotate.set', function () {
			console.log( 'set annotation: ' + annotator.type );
			self.onShow();
		} ) );

	}

}

AnnotatePanel.prototype = Object.create( Panel.prototype );


export { AnnotatePanel };


// EOF