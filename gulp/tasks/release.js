import gulpMain from 'gulp';
import gulpHelp from 'gulp-help';
import bump from 'gulp-bump';
import runSequence from 'run-sequence';
import source from 'vinyl-source-stream';
import uglify from 'gulp-uglify';
import tag_version from 'gulp-tag-version';
import git from 'gulp-git';
import filter from 'gulp-filter';
import prompt from 'gulp-prompt';

var gulp = gulpHelp(gulpMain);

var version = {type: 'patch'};

gulp.task('release:viewer', false, () => {

  var files = [
    'build/viewer/**/*.*',
    'build/viewer/*.*'
  ];

  return gulp.src(files)
    .pipe(gulp.dest('dist/viewer'));
})

gulp.task('release:compress', false, () => {

  return gulp.src('build/example/main.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/example'));
});

gulp.task('release:example', false, () => {

  var files = [
    'build/example/**/*.*',
    'build/example/*.*',
    '!build/example/main.js'
  ];

  return gulp.src(files)
    .pipe(gulp.dest('dist/example'));
});


gulp.task('release:tag', false, function(){

  return gulp.src('./package.json')
    .pipe(bump(version))
    .pipe(gulp.dest('./'))
    .pipe(git.commit('bumps package version'))
    .pipe(filter('package.json'))
    .pipe(tag_version());
});

gulp.task('release:tag:create-version', false, function(){

  return gulp.src('*')
    .pipe(prompt.prompt({
      type: 'checkbox',
      name: 'bump',
      message: 'What type of release is it? (Patch: hotfix, Minor: Release, Major: Major release)',
      choices: ['patch', 'minor', 'major']
    },function(res){

      if(res.bump.length > 0){
        version.type = res.bump[0];
      }

    }));
});



gulp.task('release:build', false, (cb)=>{
  return runSequence(['release:compress','release:viewer','release:example'], 'release:tag:create-version', 'release:tag', cb);
});