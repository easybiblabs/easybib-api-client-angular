var uglify = require('gulp-uglify'),
  streamify = require('gulp-streamify'),
  rename = require('gulp-rename');

gulp.task('uglify', ['remove-require-angular'], function() {
  return gulp.src('./dist/index.js')
    .pipe(streamify(uglify({ mangle: false })))
    .pipe(rename('index.min.js'))
    .pipe(gulp.dest('./dist/'));
});
