
function replaceExtension( fileName, newExtention ) {

	if ( fileName === undefined ) return 'file set';

	return fileName.split( '.' ).shift() + '.' + newExtention;

}

function dataURL( json ) {

	return 'data:text/json;charset=utf8,' + encodeURIComponent( JSON.stringify( json, null, '\t' ) );

}

export { replaceExtension, dataURL };