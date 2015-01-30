var browserify = require('browserify'),
  source = require('vinyl-source-stream'),
  renameify = require('renameify');

gulp.task('browserify', function() {
  var bro = browserify('./src/index.js', {
    standalone: 'easybib-api-client'
  });
  bro.ignore('angular');
  bro.transform(renameify.configure({
    variables: {
      'angular-bsfy': 'angular'
    }
  }));
  return bro.bundle()
    .pipe(source('index.js'))
    .pipe(gulp.dest('./dist/'));
});
