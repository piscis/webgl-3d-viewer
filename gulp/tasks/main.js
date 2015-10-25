import gulpMain from 'gulp';
import gulpHelp from 'gulp-help';
import gulpPlugins from 'gulp-load-plugins';
import runSequence from 'run-sequence';

var plugins = gulpPlugins({camelize:true});
var gulp = gulpHelp(gulpMain);

gulp.task('dev','Start gulp with `gulp dev` to start developing', (cb)=>{
  return runSequence('clean:build','source','watch',cb);
});

gulp.task('release','Start gulp with `gulp release` to create a release build', (cb)=>{
  return runSequence(['clean:build','clean:dist'],'source','release:build', cb);
});

gulp.task('deploy','Start gulp with `gulp deploy` to create a release build and deploy it to the Github pages repository', (cb)=>{
  return runSequence('release','deploy-to-gh-pages', cb);
});