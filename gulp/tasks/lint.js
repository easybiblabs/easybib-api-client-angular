var eslint = require('gulp-eslint'),
  jscs = require('gulp-jscs');

gulp.task('lint', ['eslint', 'jscs']);

// rules set in frontend/.eslintrc
gulp.task('eslint', function() {
  return gulp
    .src([
      'src/**/*.js'
    ])
    .pipe(eslint())
    .pipe(eslint.formatEach('compact', process.stderr))
    .pipe(eslint.failOnError());
});

gulp.task('jscs', function() {
  return gulp
    .src([
      'src/**/*.js'
    ])
    .pipe(jscs('./jscs.json'));
});
