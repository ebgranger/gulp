/**
     * Finds all dirs with a build.lst file. Then concatenates all javascript files in the build.lst 
     * to a single file with "-cat" suffix using direct parent directory as name of 
     * file(e.g. cart-cat.js if location was cart/build.lst). Output creates output directory structure 
     * again using previous parent directory as the output directory name. 
     * 
     * @param  {string} script - gulp task name 
     * @return {files} outputs concatenated js files and directories output directory
     */
    gulp.task('script', function (cb) {
        // use glob pattern to grab any build.lst file in javascript dir
        glob('./javascript/**/build.lst', function (err, files) {
            // loop through the returned array of paths 
            files.forEach(function(currentValue, index, array) {
                // read each build.lst file
                fs.readFile(currentValue, 'utf-8', function(e, data) {
                    // error handling 
                    if (e) return console.log(e);

                    var array = data.toString().split("\n"), // convert list in file to array
                        frags = currentValue.split('/'), // split file path into array seperated at each forward slash
                        filename = frags[frags.length - 2], // get the parent directory name
                        filePath = currentValue.replace('build.lst', '').substr(2); // get file path

                    // loops through the array of file paths in the build list, 
                    // and generates a full file path so that gulp.src will properly
                    // build the output directory
                    for(var j = 0; j < array.length; j++ ) {
                        array[j] = path.resolve(__dirname + '/' + filePath + '/' + array[j]);
                    }

                    // gulp.src
                    return gulp.src(array) // pass the build list array
                        .pipe(insert.transform(function(contents, file) { // adding the file name at the begining of each concatenated section
                            return '/* ' + file.path.slice(file.path.lastIndexOf('assets/')) + ' */\n\n' + contents // @TODO There's got to be an easier way!
                        }))
                        .pipe(concat(filename + '-cat.js')) 
                        .pipe(insert.prepend('/* Build Date: ' + Date() + ' */' + '\n\n')) // Build Date
                        .pipe(gulp.dest('./output/' + filePath));
                });
            });
        });

        // @TODO this is my rudimentary work-around, I can't get my callbacks working ATM?
        setTimeout(function () {
            cb();
        }, 2000);
    });