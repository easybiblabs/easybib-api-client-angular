var replace = require('gulp-replace');

// to be compatible with non-browserify builds
gulp.task('remove-require-angular', ['browserify'], function(){
  return gulp.src(['./dist/*.js'])
    .pipe(replace(/^var\s+angular\s+=\s+require\('angular'\);$/gmi,''))
    .pipe(gulp.dest('./dist/'));
});
