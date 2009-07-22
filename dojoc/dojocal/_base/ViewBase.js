/*
 * Author: unscriptable
 * Date: Feb 23, 2009
 */
dojo.provide('dojoc.dojocal._base.ViewBase');

dojo.require('dijit._Templated');
dojo.require('dijit._Widget');
dojo.require('dojoc.dojocal._base.ViewMixin');

(function (/* dojoc.dojocal */ djc) { // closure for local variables

/**
 * dojoc.dojocal._base.ViewBase
 */
dojo.declare('dojoc.dojocal._base.ViewBase', [dijit._Widget, dojoc.dojocal._base.ViewMixin], {

	/* overrides */

	eventPositionerClass: 'dojoc.dojocal._base.EventPositioner',

	eventMoveableClass: 'dojoc.dojocal._base.EventMoveable',

	addEvent: function (/* dojoc.dojocal.UserEvent */ e) {
		this.inherited(arguments);
//		if (e.options)
//			e.options.eventClass = e.options.eventClass || this.eventClass;
		var w = this._createEventWidget(e);
		this._addEvent(w);
		w.startup();
		this._afterEventChange();
	},

	addEvents: function (/* Array of dojoc.dojocal.UserEvent */ events) {
		// TODO: remove calDef param
		var _this = this;
		dojo.forEach(events, function (e) {
//			if (e.options)
//				e.options.eventClass = e.options.eventClass || _this.eventClass;
			var w = _this._createEventWidget(e);
			_this._addEvent(w);
			w.startup();
		});
		this._afterEventChange();
	},

	removeEvent: function (/* dojoc.dojocal._base.EventMixin */ event) {
		// TODO!!!!
		this.inherited(arguments);
		this._afterEventChange();
	},

	clearEvents: function () {
		this.inherited(arguments);
		this._removeAllEventsFromView(this.domNode);
	},

	postCreate: function () {
		this.inherited(arguments);
		// make all text unselectable (event widgets should make their text selectable only when/if they are being edited in-place)
		dojo.setSelectable(this.domNode, false);
		// create helper objects
		var epClassName = this.eventPositionerClass;
		if (epClassName) {
			dojo['require'](epClassName);
			var epClass = dojo.getObject(epClassName);
			this._eventPositioner = new epClass();
		}
		dojo.subscribe(djc.createDojoCalTopic('eventUpdated', this.gridId), this, '_onEventDataChange');
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

	_updateEvent: function (eWidget) {
		// updates the view-specific visual representation of the event based on new data (e.g. time of day)
		// TODO: put common functionality here (see subclasses for now)
	},

	_createEventWidget: function (userEvent, calDef) {
		var opts = userEvent.options,
			eventConstructor = dojo.getObject(opts.eventClass);
		return this._newEventWidget(eventConstructor, userEvent, opts.calDef.color, opts.calDef.fontColor, opts.calDef.calendarId);
	},

	_cloneEventWidget: function (origWidget) {
		var eventConstructor = dojo.getObject(origWidget.declaredClass);
		return this._newEventWidget(eventConstructor, origWidget.data, origWidget.color, origWidget.fontColor, origWidget.calendarId);
	},

	_newEventWidget: function (eventConstructor, data, color, fontColor, calendarId) {
		var eventWidget = new eventConstructor({data: data, color: color, fontColor: fontColor, calendarId: calendarId});
		// add special attributes so we can find this event easily
		dojo.attr(eventWidget.domNode, 'isDojocalEvent', 'true');
		dojo.attr(eventWidget.domNode, 'dojocalCalId', eventWidget.calendarId);
		dojo.attr(eventWidget.domNode, 'dojocalEventId', eventWidget.data.uid);
		if (this.dndMode != djc.DndModes.NONE) {
			this._makeEventDraggable(eventWidget);
		}
		return eventWidget;
	},

	_makeEventDraggable: function (eventWidget) {
		if (this.eventMoveableClass) {
			// ensure we have the right file loaded
			dojo['require'](this.eventMoveableClass);
			dojo.addClass(eventWidget.domNode, 'draggableEvent');
			var params = this._getDragBounds(eventWidget),
				moveClass = dojo.getObject(this.eventMoveableClass),
				moveable = eventWidget.moveable = new moveClass(eventWidget.domNode, params);
			eventWidget.connect(moveable, 'onMoveStart', dojo.hitch(this, '_onEventDragStart', eventWidget));
			eventWidget.connect(moveable, 'onMoving', dojo.hitch(this, '_onEventDragging', eventWidget));
			eventWidget.connect(moveable, 'onMoveStop', dojo.hitch(this, '_onEventDragStop', eventWidget));
		}
	},

	_getDragBounds: function (eventWidget) {
		return {
			delay: this.dndDetectDistance,
			sizerNode: eventWidget.handleNode || null
		};
	},

	// drag-and-drop stubs (overridden in subclasses)
	_onEventDragStart: function (eventWidget, /* dojo.dnd.Mover */ mover) {},
	_onEventDragging: function (eventWidget, /* dojo.dnd.Mover */ mover) {},
	_onEventDragStop: function (eventWidget, /* dojo.dnd.Mover */ mover) {},

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
			eWidget.setSelected(true);
			this._selectedEvent = eWidget;
		}
	},

	_getAllEventsInNode: function (/* DOMNode */ viewEl, /* String? */ calendarId, /* String? */ eventId) {
		// retrieve all widgets whose nodes we've marked as isDojocalEvent
		// if the caller specified a particular calendar or event id, then filter further
		var filter = '[isDojocalEvent]';
		if (calendarId >= 0)
			filter += '[dojocalCalId=' + calendarId + ']';
		if (eventId >= 0)
			filter += '[dojocalEventId=' + eventId + ']';
		return dojo.query(filter, viewEl).map(dijit.byNode);
	},

	_removeAllEventsFromView: function (/* DOMNode */ viewEl, /* String? */ calendarId, /* String? */ eventId) {
		dojo.forEach(this._getAllEventsInNode(viewEl, calendarId, eventId), function (e) {
			e.destroy();
		});
	},

	/* handy day-of-week translators */

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

	_onEventDataChange: function (view, sourceWidget, oldProps) {
		// don't proceed if we're the view that initiated the change
		if (view != this) {
			this._getAllEventsInNode(this.containerNode, null, sourceWidget.getUid()).forEach(function (eWidget) {
				for (var p in oldProps) {
					// set new value in widget by fabricating setter and getter for each property that changed
					var root = p.substr(0, 1).toUpperCase() + p.substr(1),
						setter = 'set' + root,
						getter = 'get' + root,
						value = getter in sourceWidget ? sourceWidget[getter]() : sourceWidget[p];
					if (setter in eWidget)
						eWidget[setter](value);
					else
						eWidget[p] = value;
				}
				this._updateEvent(eWidget);
			}, this);
		}
	},

	_afterEventChange: function () {
		// summary: this should be run after adding, moving, or removing one or more events
	}


});

})(dojoc.dojocal); // end of closure for local variables