/**
 *  Simple Tags: Adds bootstrap 3 tag input for Meteor, with autocomplete (typeahead).
 */

var SimpleTags = new Meteor.Collection('simpletags');

if(Meteor.isClient) {
  var LocalTags = {
  tags: [],
  dep: new Deps.Dependency(),
  // takes an array and replaces the current tags
  set: function(tags) {
    this.tags = tags;
    this.dep.changed();

    return this.tags;
  },
  // Adds a tag to the stack
  add: function(tag) {
    if(!_.contains(this.tags,tag)) {
      this.tags.push(tag);
      this.dep.changed();
      return true;
    }

    return false;
  },
  // Removes a specific tag
  remove: function(tag) {
    this.tags = _.reject(this.tags, function(t) {
      return t === tag;
    });

    this.dep.changed();
    return this.tags;
  },
  // removes the last tag in the stack
  pop: function() {
    this.tags.pop();
    this.dep.changed();

    return this.tags;
  },
  // Returns all tags
  getTags: function() {
    this.dep.depend();

    return this.tags;
  }
};

Template.TagsInput.rendered = function() {
  var t = $('input.tags-input');

  $('body').on('submit', function(evt) {
    Meteor.call('addTags', LocalTags.getTags());
  });

	if(this.data.values) {
		LocalTags.set(this.data.values);
		resizeInput();
	}

  // if the typeahead is in scope, attach it to the input field.
  // TODO: should be optional
  if(t.typeahead) {
    $('input.tags-input').typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    },
    {
      source: function(query, process) {
        var currentTags =  LocalTags.getTags() || [];
        var subscription = Meteor.subscribe('tags', query, currentTags);
        process(_.map(SimpleTags.find({
          $and: [
            {
              name: new RegExp(query, 'i')
            },
            {
              name: { $nin: currentTags }
            }
          ]
        },
        {
          fields: {
            name: 1
          },
          limit: 5
        }).fetch(), function(item) {
          return {value: item.name};
        }));
      }
    });
  }
};

Template.TagsInput.events({
	'keydown input.tags-input': function (evt, tmpl) {

		var key = evt.keyCode;
		var currentValue = evt.currentTarget.value;
		var minChars = tmpl.data && parseInt(tmpl.data.minChars, 10) || 2;

		// If the return key is hit, add the tag to the list.
		if(key === 13) {
			evt.preventDefault();
			var tag = evt.currentTarget.value.trim();

			if (tag && tag.length >= minChars) {
				if(LocalTags.add(tag)) {
          evt.currentTarget.value = "";
        }
      } else {
        evt.currentTarget.value = tag.trim();
      }
      resizeInput();
		// if the backspace is hit, remove the last item in the list.
    } else if (key === 8 && currentValue.length === 0 ) {
      evt.preventDefault();
      LocalTags.pop();
      resizeInput();
    }
  }
});

// Needs some better logic. This doesn't take care of if a tag gets pushed down
// into a new line.
var resizeInput = function() {
	Meteor.defer(function() {

		var tags = $('div.tag');
		var tagsField = $('.tags-field');
		var inputContainer = $('div.input-container');
		var tagsWidth = 40;

    _.each(tags, function(tag) {
      tagsWidth = tagsWidth + $(tag).width() + 20;
    });

    var width = tagsField.width() - (tagsWidth % tagsField.width()) - ((tagsWidth / tagsField.width()) * 40);

    if (width < 200) {
      width = tagsField.width();
    }

    inputContainer.width(width);

    return true;
  });
};

Template.TagsInput.helpers({
	vals: function () {
		return LocalTags.getTags();
	}
});

Template.Tag.events({
	'click .tag a': function (evt, tmpl) {
		evt.preventDefault();
		LocalTags.remove(tmpl.find('.tag-label').innerHTML.toString());
	}
});
}

if(Meteor.isServer) {
  Meteor.methods({
    addTags: function(tags) {
      tags = tags || [];

      _.each(tags, function(tag) {
        SimpleTags.update({
          name: tag
        },
        {
          $set : { name: tag }
        },
        {
          upsert : true
        });
      });
    }
  });

  Meteor.publish('tags', function(query, currentTags) {
    currentTags = currentTags || [];
    return SimpleTags.find({
      $and: [
        {
          name: new RegExp(query, 'i')
        },
        {
          name: { $nin: currentTags }
        }
      ]
    },
    {
      fields: {
        name: 1
      },
      limit: 5
    });
  });
}
