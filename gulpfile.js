/**
 * Declare node modules
 * @type {[type]}
 */
var gulp = require('gulp'),
    debug = require('gulp-debug'),
    less = require('gulp-less'),
    path = require('path'),
    rename = require("gulp-rename"),
    minifyCSS = require('gulp-minify-css'),
    gutil = require('gulp-util'),
    glob = require('glob'),
    fs = require('fs-extra'),
    watch = require('gulp-watch'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    insert = require('gulp-insert'),
    notify = require("gulp-notify"),
    rimraf = require('rimraf'),
    gulpTap = require('gulp-tap');


/**
 * Finds all dirs with a build.lst file, concatenates all javascript files in the build.lst
 * to a single file with "-cat" suffix using direct parent directory as name of
 * file(e.g. cart-cat.js if build.lst was in cart directory) creates output directory structure
 * again using previous parent directory as the output directory name.
 *
 * @param  {string} script - gulp task name
 * @return {files} outputs concatenated js files and directories output directory
 */
gulp.task('script', function(cb) {

    var promises = [];

    // use glob pattern to grab any build.lst file in javascript dir
    glob('./javascript/**/build.lst', function(err, files) {
        // loop through the returned array of paths
        files.forEach(function(currentValue, index, array) {

            promises.push(new Promise(function(resolve, reject) {
                // read each build.lst file
                fs.readFile(currentValue, 'utf-8', function(e, data) {
                    // error handling
                    if(e) return console.log(e);

                    var array = data.toString().split("\n"), // convert list in file to array
                        frags = currentValue.split('/'), // split file path into array seperated at each forward slash
                        filename = frags[frags.length - 2], // get the parent directory name
                        filePath = currentValue.replace('build.lst', '').substr(2); // get file path

                    // loops through the array of file paths in the build list,
                    // and generates a full file path so that gulp.src will properly
                    // build the output directory
                    for(var j = 0; j < array.length; j++) {
                        array[j] = path.resolve(__dirname + '/' + filePath + '/' + array[j]);
                    }

                    resolve();

                    // gulp.src
                    return gulp.src(array) // pass the build list array
                        .pipe(insert.transform(function(contents, file) { // adding the file name at the begining of each concatenated section
                            return '/* ' + file.path.slice(file.path.lastIndexOf('client_assets/')) + ' */\n\n' + contents // @TODO There's got to be an easier way!
                        }))
                        .pipe(concat(filename + '-cat.js'))
                        .pipe(insert.prepend('/* Build Date: ' + Date() + ' */' + '\n\n')) // Build Date
                        .pipe(gulp.dest('./output/' + filePath))
                        .pipe(uglify({mangle: false}))
                        .pipe(rename(function(path) {
                            path.basename = path.basename.replace('-cat', '-min');
                        }))
                        .pipe(gulp.dest('./output/' + filePath));
                });
            }));

        });
    });

    // Resolve the promise if all the async tasks have finished
    return Promise.all(promises)
        .catch(function(error) {
            console.log('One of the asynchronous tasks has failed.');
        });
});