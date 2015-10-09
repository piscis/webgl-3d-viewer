import gulpMain from 'gulp';
import gulpHelp from 'gulp-help';
import gulpPlugins from 'gulp-load-plugins';
import del from 'del';

var plugins = gulpPlugins({camelize:true});
var gulp = gulpHelp(gulpMain);


gulp.task('clean:build', false, (cb)=>{

  let files = [
    'build/**/*.*',
    'build/*.*',
    'build/.*'
  ];

  return del(files, cb);
});