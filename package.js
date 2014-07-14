Package.describe({
  name: "simple-tags",
	summary: "Simple Tags - Adds tag input for Meteor, with autocomplete (typeahead)"
});

Package.on_use(function (api, where) {
	api.use(['ui', 'templating', 'deps', 'jquery', 'underscore'], 'client');

  api.add_files(['simple-tags.html', 'simple-tags.css', 'lib/typeahead.bundle.js'], 'client');

  api.add_files(['simple-tags.js'], ['client', 'server']);
});
