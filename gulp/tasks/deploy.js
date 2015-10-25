import gulpMain from 'gulp';
import gulpHelp from 'gulp-help';
import del from 'del';

var gulp = gulpHelp(gulpMain);


var ghPages = require('gulp-gh-pages');

gulp.task('deploy-to-gh-pages', {},  function() {

  let opts = {};

  return gulp.src('./dist/**/*')
    .pipe(ghPages());
});