import gulpMain from 'gulp';
import gulpHelp from 'gulp-help';
import gulpPlugins from 'gulp-load-plugins';
import runSequence from 'run-sequence';

var plugins = gulpPlugins({camelize:true});
var gulp = gulpHelp(gulpMain);

gulp.task('dev','Start gulp with `gulp dev` to start developing', (cb)=>{
  return runSequence('clean:build','source','watch',cb);
});