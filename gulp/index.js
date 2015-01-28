var fs = require('fs');

gulp = require('gulp');

fs.readdirSync('./gulp/tasks/').forEach(function(task) {
  require('./tasks/' + task);
});
