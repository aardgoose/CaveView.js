var gulp    = require( 'gulp' );
var connect = require( 'gulp-connect' );


gulp.task('runserver', function() {
 
	connect.server( { root: 'build' } );

});

 gulp.task( 'default', [ 'runserver' ] );
