/*
 * Author: john
 * Date: Feb 23, 2009
 */
dojo.provide('dojoc.dojocal._base.ViewBase');

dojo.require('dijit._Templated');
dojo.require('dijit._Widget');
dojo.require('dojoc.dojocal._base.ViewMixin');

(function () { // closure for local variables

var djc = dojoc.dojocal;

/**
 * dojoc.dojocal.views.MultiDayViewBase
 */
dojo.declare('dojoc.dojocal._base.ViewBase', [dijit._Widget, dojoc.dojocal._base.ViewMixin], {

	/* overrides */

	eventPositionerClass: 'dojoc.dojocal._base.EventPositioner',

	addEvent: function (/* dojoc.dojocal.UserEvent */ e, calendar) {
		this.inherited(arguments);
		if (e.options)
			e.options.eventClass = e.options.eventClass || this.eventClass;
		var w = this._createEventWidget(e, calendar);
		this._addEvent(w);
		w.startup();
		this._postEventChange();
	},

	addEvents: function (/* Array of dojoc.dojocal.UserEvent */ events, calendar) {
		var _this = this;
		dojo.forEach(events, function (e) {
			if (e.options)
				e.options.eventClass = e.options.eventClass || _this.eventClass;
			var w = _this._createEventWidget(e, calendar);
			_this._addEvent(w);
			w.startup();
		});
		this._postEventChange();
	},

	removeEvent: function (/* dojoc.dojocal._base.EventMixin */ event) {
		// TODO!!!!
		this.inherited(arguments);
		this._postEventChange();
	},

	clearEvents: function () {
		this.inherited(arguments);
		this._removeAllEventsFromView(this.domNode);
	},

	postCreate: function () {
		this.inherited(arguments);
		// create helper objects
		var epClassName = this.eventPositionerClass;
		if (epClassName) {
			dojo['require'](epClassName);
			var epClass = dojo.getObject(epClassName);
			this._eventPositioner = new epClass();
		}
	},

//	startup: function () {
//		this.inherited(arguments);
//	},
//
//	destroy: function () {
//		this.inherited(arguments);
//	},

	/* private methods */

	_addEvent: function (eWidget) {
		// TODO: put common functionality here (see subclasses for now)
	},

	_createEventWidget: function (userEvent, calendar) {
		var eventClass = userEvent.options.eventClass || calendar.defaultEventClass || this.defaultEventClass,
			eventConstructor = dojo.getObject(eventClass),
			eventWidget = this._newEventWidget(eventConstructor, userEvent.data, userEvent.options.color, userEvent.options.fontColor, calendar.id);
		return eventWidget;
	},

	_cloneEventWidget: function (origWidget) {
		var eventClass = dojo.getObject(origWidget.declaredClass),
			eventWidget = this._newEventWidget(eventClass, origWidget.data, origWidget.color, origWidget.fontColor, origWidget.calendarId);
		return eventWidget;
	},

	_newEventWidget: function (clazz, data, color, fontColor, calendarId) {
		var eventWidget = new clazz({data: data, color: color, fontColor: fontColor, calendarId: calendarId});
		// connect events
		eventWidget.connect(eventWidget, 'onDataChange', dojo.hitch(this, '_onEventDataChange', eventWidget));
		// add special attributes so we can find this event easily
		dojo.attr(eventWidget.domNode, 'isDojocalEvent', 'true');
		dojo.attr(eventWidget.domNode, 'dojocalCalId', eventWidget.calendarId);
		dojo.attr(eventWidget.domNode, 'dojocalEventId', eventWidget.data.uid);
		return eventWidget;
	},

	_removeEventWidget: function (eWidget) {
		eWidget.destroy();
	},

	_selectEventWidget: function (eWidget) {
		// pass null to unselect currently selected event
		if (this._selectedEvent) {
			this._selectedEvent.setSelected(false);
			delete this._selectedEvent;
		}
		if (eWidget) {
			eWidget.setSelected(selected);
			this._selectedEvent = eWidget;
		}
	},

	_getAllEventsInNode: function (/* DOMNode */ viewEl, /* String? */ calendarId, /* String? */ eventId) {
		// retrieve all widgets whose nodes we've marked as isDojocalEvent
		// if the caller specified a particular calendar or event id, then filter further
		var filter = '[isDojocalEvent]';
		if (calendarId)
			filter += '[dojocalCalId=' + calendarId + ']';
		if (eventId)
			filter += '[dojocalEventId=' + eventId + ']';
		return dojo.query(filter, viewEl).map(dijit.byNode);
	},

	_removeAllEventsFromView: function (/* DOMNode */ viewEl, /* String? */ calendarId, /* String? */ eventId) {
		dojo.forEach(this._getAllEventsInNode(viewEl, calendarId, eventId), function (e) {
			e.destroy();
		});
	},

	/* handy day-of-week translators */

	// override these for multi-week views / views that arent' 7-days wide!

	_dayOfWeekToCol: function (dayOfWeek) {
		return (dayOfWeek - this.weekStartsOn) % 7;
	},

	_colToDayOfWeek: function (colNum) {
		return (colNum + this.weekStartsOn) % 7;
	},

	_nodeToCol: function (node) {
		var layout = this._nodeToLayout(node);
		return parseInt(dojo.attr(layout, 'day'));
	},

	_nodeToDate: function (node) {
		var col = this._nodeToCol(node);
		return dojo.date.add(this._startDate, 'day', col);
	},

	_nodeToLayout: function (node) {
		return djc.getAncestorByAttrName(node, 'day');
	},

	_timeOfDayInMinutes: function (date) {
		return date.getHours() * 60 + date.getMinutes() + Math.round(date.getSeconds() / 60);
	},

	/* common event handlers */

	_onDayLayoutClick: function (e) {
		// identify what was clicked (type) and the pertinent node.
		// attribute names must be in reverse dom order
		var node, type;
		// TODO: the code that injects 'isdojocalevent' should be in the same class that relies on it (see Grid.js / _onEventAdded)
		dojo.some(['isdojocalevent', 'day'], function (attrName) {
			type = attrName;
			return node = djc.getAncestorByAttrName(e.target, attrName);
		});
		if (node) {
			if (type == 'day') {
				return this._onDayClick(node, e);
			}
			else if (type == 'isdojocalevent') {
				return this._onEventClick(dijit.byNode(node), e);
			}
		}
	},

	_onDayClick: function (layoutNode, e) {
		this._selectEventWidget(null);
	},

	_onEventClick: function (eventWidget, e) {
		this._selectEventWidget(eventWidget);
	},

	_onEventDataChange: function (eventWidget) {
		// TODO:
	},

	_postEventChange: function () {
	}


});

})(); // end of closure for local variables