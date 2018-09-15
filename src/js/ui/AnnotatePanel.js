
import { Viewer } from '../viewer/Viewer';
import { Panel } from './Panel';
import { Annotations } from '../viewer/Annotations';


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

		const annotationInfo = event.annotationInfo;
		var annotation = annotationInfo.annotation;

		if ( annotation === undefined ) {

			annotation = {
				type: 'none'
			};

			self.onShow();
			self.addDynamic( page.addLine( 'Station: ' + annotationInfo.name ) );
			self.addDynamic( page.addSelect( 'annotate.type', annotators, annotation, 'type' ) );

			self.addDynamic( page.addButton( 'annotate.select_type', function () {

				annotationInfo.annotation = annotation;

				if ( annotation.type !== 'none' ) {

					annotationInfo.annotation = annotation;
					_onType( event );

				}

			} ) );

		} else {

			_onType( event );

		}

	}

	function _onType ( event ) {

		const annotationInfo = event.annotationInfo;
		var annotation = annotationInfo.annotation;

		self.onShow();
		self.addDynamic( page.addLine( 'Station: ' + annotationInfo.name ) );
		self.addDynamic( page.addLine( 'Type: ' + annotation.type ) );

		const annotator = Annotations.getAnnotator( annotation.type );

		annotator.parameters.forEach( function ( parameter ) {

			const value = annotation[ parameter.name ] || '';

			self.addDynamic( page.addTextBox( parameter.caption, value, function ( v ) {
				parameter.getResult = v;
			} ) );

		} );

		self.addDynamic( page.addButton( 'annotate.save', function () {

			let errors = 0;

			annotator.parameters.forEach( function ( parameter ) {

				const result = parameter.getResult();

				if ( parameter.valid( result ) ) {

					annotation[ parameter.name ] = result;

				} else {

					errors++;

				}

			} );

			if ( errors === 0 ) {

				event.add( annotation );
				self.onShow();

			}

		} ) );

	}

}

AnnotatePanel.prototype = Object.create( Panel.prototype );


export { AnnotatePanel };


// EOF