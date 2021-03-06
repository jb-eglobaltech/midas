define([
  'jquery',
  'underscore',
  'backbone',
  'utilities',
  'popovers',
  'events_collection',
  'event_collection_view',
  'modal_component',
  'event_form_view'
], function ($, _, Backbone, utils, Popovers, EventsCollection, EventCollectionView, ModalComponent, EventFormView) {

  var popovers = new Popovers();

  Application.Controller.EventList = Backbone.View.extend({

    el: "#event-list-wrapper",

    events: {
      'click .add-event'                : 'add',
      'click .rsvp'                     : 'toggleRSVP',
      'mouseenter .data-event-flag-true': 'buttonRSVPOn',
      'mouseleave .data-event-flag-true': 'buttonRSVPOff',
      "mouseenter .project-people-div"  : popovers.popoverPeopleOn,
      "click .project-people-div"       : popovers.popoverClick
    },

    initialize: function (settings) {
      this.options = _.extend(settings, this.defaults)
      this.fireUpEventsCollection()
      this.requestEventsCollectionData()

      this.listenTo(this.collection, "event:save:success", function () {
        $(".modal").modal('hide')
        this.requestEventsCollectionData()
      });
    },

    fireUpEventsCollection: function () {
      if (this.collection) {
        this.collection.initialize()
      } else {
        this.collection = new EventsCollection()
      }
    },

    requestEventsCollectionData: function () {
      var self = this;
      this.collection.fetch({
        url: '/api/event/findAllByProjectId/' + parseInt(this.options.projectId),
        success: function (collection) {
          self.renderEventCollectionView(collection)
          collection = self.collection
        }
      })
    },

    renderEventCollectionView: function (collection) {
      if (this.eventCollectionView) {
        this.eventCollectionView.cleanup()
      }

      this.eventCollectionView = new EventCollectionView({
        el: "#event-list-wrapper",
        onRender: true,
        collection: collection,
        projectId: this.options.projectId
      });

      popovers.popoverPeopleInit(".project-people-div");
    },

    add: function (e) {
      if (e.preventDefault) e.preventDefault();

      if (this.modalComponent) this.modalComponent;
      this.modalComponent = new ModalComponent({
        el: "#container",
        id: "addEvent",
        modalTitle: 'Add Event'
      }).render();

      if (!_.isUndefined(this.modalComponent)) {
        if (this.eventFormView) this.eventFormView;
        this.eventFormView = new EventFormView({
          el: ".modal-template",
          projectId: this.options.projectId,
          collection: this.collection
        }).render();
      }
    },

    updatePeople: function (e, inc) {
      var peopleDiv = $($(e.currentTarget).parents('.event')[0]).find('.event-people')[0];
      var numDiv = $(peopleDiv).children('.event-people-number');
      var newNum = parseInt($(numDiv).html());
      if (inc) {
        newNum++
      } else {
        newNum--;
      }
      $(numDiv).html(newNum);
      var textDiv = $(peopleDiv).children('.event-people-text')[0];
      if (newNum == 1) {
        $(textDiv).html($(textDiv).data('singular'));
      } else {
        $(textDiv).html($(textDiv).data('plural'));
      }
    },

    buttonRSVPOn: function (e) {
      $(e.currentTarget).button('hover');
    },

    buttonRSVPOff: function (e) {
      $(e.currentTarget).button('going');
    },

    toggleRSVP: function (e) {
      var self = this;
      if (e.preventDefault) e.preventDefault();
      // get the id from the parent event div
      var id = $($(e.currentTarget).parents('div.event')[0]).data('id');
      if ($(".rsvp").hasClass("data-event-flag-true") === false) {
        $(".rsvp").removeClass("data-event-flag-false");
        $(".rsvp").addClass("data-event-flag-true");
        $(e.currentTarget).button('going');
        self.updatePeople(e, true);
        $.ajax({
          url: '/api/event/attend/' + id,
          success: function (data) {
          }
        });
      } else {
        $(".rsvp").removeClass("data-event-flag-true");
        $(".rsvp").addClass("data-event-flag-false");
        $(e.currentTarget).button('rsvp');
        self.updatePeople(e, false);
        $.ajax({
          url: '/api/event/cancel/' + id,
          success: function (data) {
          }
        })
      }
    },

    cleanup: function () {
      if (this.eventCollectionView) this.eventCollectionView.cleanup();
      removeView(this);
    }

  });

  return Application.Controller.EventList
})