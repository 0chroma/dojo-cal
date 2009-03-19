/*
	Copyright (c) 2004-2009, The Dojo Foundation
	All Rights Reserved.

	Licensed under the Academic Free License version 2.1 or above OR the
	modified BSD license. For more information on Dojo licensing, see:

		http://dojotoolkit.org/book/dojo-book-0-9/introduction/licensing
*/

/*
	Author: unscriptable
	Date: Dec 5, 2008
*/
dojo.provide('dojoc.dojocal.Grid');

dojo.require('dojoc.dojocal._base.common');
dojo.require('dijit._Templated');
dojo.require('dijit._Widget');
dojo.require('dijit._Container');
dojo.require('dojo.fx');
dojo.require("dojo.date");
dojo.require('dojo.date.locale');
dojo.require('dojo.dnd.Moveable');
dojo.require('dojoc.dojocal._base.EventMoveable');
dojo.require('dojoc.dojocal._base.Mover');
dojo.require('dojoc.dojocal._base.ViewMixin');

(function () { // closure for local variables

// bring these local for speed, size, and convenience
var djc = dojoc.dojocal,
	dndModes = djc.DndModes,
	allDayEventsPositions = djc.AllDayEventPositions;

dojo.declare('dojoc.dojocal.Grid', [dijit._Widget, dijit._Templated, dijit._Container], {
	/**
	 * summary: the main dojocal widget used to display a day, week, or month view of a user's calendar events
	 * requires: dojo 1.1.1 / dijit 1.1.1 or higher
	 * TODO:
	 * v finish removing "pseudos" from drag and drop methods
	 * - finish transitions to/from MONTH view
	 * - dnd resize of events
	 * - Move views into separate widget classes so they can be created dynamically
	 * - Intelligent overlap:
	 *     - Figure out bugs when events span multiple groups
	 * - Use Adam Peller's CLDR functions to automatically grab the locale's start of week and weekend days?
	 * - When dragging in day view, the week view is not updated (use data store notifications?)
	 * - Finish All Day row
	 *   - Add dblclick functionality to splitter (collapse/uncollapse)
	 *   v Gray-out background when footer will close (in addition to current font graying)
	 *   - Add ability to add events to it
	 * - Add demo/testing features:
	 *   v Add functionality to switch view
	 * 	 v grid line increment changer
	 *   v time/date format changer
	 * 	 v font resizer
	 *   - theme-switching
	 * - Future demo/testing features:
	 *   - inline edit
	 *   - navigation control
	 * - Investigate iCal format coming from the data store
	 * - Create monthly view
	 */

	templatePath: dojo.moduleUrl('dojoc.dojocal', 'resources/Grid.html'),

	store: null,

	/* public properties */

	// TODO: create a ViewPropertiesMixin and share these with ViewMixin?

	// timeCellDatePattern: String
	// the dojo.date.locale-formatted date string used in the time column on day and week views
	timeCellDatePattern: 'h:mm a',

	// headerDatePattern: String
	// the dojo.date.locale-formatted date string used in the date header, if aplicable
	headerDatePattern: 'EEE M/dd',

	// cornerCellDatePattern: String
	// the dojo.date.locale-formatted date string used in the upper left corner, if applicable
	cornerCellDatePattern: 'yyyy',

	// allDayEventAreaLabel: String
	// the label to show in the "All Day" events area time column, if applicable
	allDayEventAreaLabel: 'All Day',

	// eventClass: String
	// change this property on subclassed views to use your own custom event widgets
	eventClass: 'dojoc.dojocal.Event',

	// eventPositionerClass: String
	// change this property to create your own event positioner
	// see dojoc.dojocal._base.EventPositioner for more info
	eventPositionerClass: '',

	// minutesPerGridLine: Integer
	// number of minutes between horizontal grid lines
	minutesPerGridLine: 15,

	// userChangeResolution: Integer
	// resolution of user changes (e.g. drag and drop) in minutes
	// changes smaller than this are rounded up or down
	userChangeResolution: 15,

	// initialStartTime: Integer
	// number of minutes to scroll from midnight when displaying calendar.  use 450 for 7:30 AM, 780 for 1:00 PM
	initialStartTime: 480,

	// animationDuration: Number
	// the duration of any animations used by the grid
	animationDuration: 250,

	// date: String
	// set this to the dojocal's initial date (ISO-formatted date string)
	date: '',

	// weekStartsOn: Integer
	// the day that weeks should start on
	// 0 = sunday, 1 = monday, etc.
	// Hint: use dojo.cldr.supplemental.getFirstDayOfWeek() to let this adjust automatically
	// to the user's browser locale
	weekStartsOn: 0,

	// showWeekends: String|Array
	// set false to hide weekends
	// Hint: use dojo.cldr.supplemental.getWeekend to determine weekend days for the
	// user's browser locale
	// Warning: setting showWeekends to false and setting weekStartson to something midweek will
	// cause multi-day events to display improperly (despite being fully functional)
	// TODO: implement this showWeekends
	showWeekends: true,

	// defaultEventClass: String
	// a fully-qualified dijit class to be used to create new event widgets
	// TODO: use this when auto-creating events from data store? or remove this?
	defaultEventClass: 'dojoc.dojocal.Event',

	// dndMode: dojoc.dojocal.DndModes
	// level of drag and drop:
	//   dojoc.dojocal.DndModes.NONE -- drag and drop is not enabled
	//   dojoc.dojocal.DndModes.FLUID -- drag and drop uses a free-form method to allow smoother dragging
	//   dojoc.dojocal.DndModes.DISCRETE -- drag and drop snaps to valid positions only
	dndMode: dndModes.DISCRETE,

	// dndDetectDistance: Number
	// the distance a user must drag before a drag and drop operation is detected
	dndDetectDistance: 3,

	// dndFluidSnapThreshold: Integer
	// pixels to move before an event widget stops clinging to current day or time (for fluid dnd)
	dndFluidSnapThreshold: 25,

	// splitterMinHeight: String
	// the splitters may not be sized any smaller than this height (unless splitterIsCollapsible == true).
	// use any css measurement (except %). e.g. 2.5em, 40px, 24pt, etc.
	splitterMinHeight: '2em',

	// splitterMaxHeight: String
	// the splitters may be opened to this height.
	// use any css measurement (except %). e.g. 2.5em, 40px, 24pt, etc.
	splitterMaxHeight: '10em',

	// splitterIsCollapsible:  Boolean
	// the splitters will collapse if the user drags them below splitterMinHeight
	splitterIsCollapsible: true,

	/***** public event hooks *****/

	// onDayClick: Function
	// connect to this event to capture user clicks on the day cells
	onDayClick: function (e, date, view) {},

	// onHeaderClick: Function
	// connect to this event to capture user clicks on the header cells
	onHeaderClick: function (e, date, view) {},

	// onHeaderDblClick: Function
	// connect to this event to capture user double-clicks on the header cells
	onHeaderDblClick: function (e, date, view) {},

	// TODO: add many more public event hooks

	/***** public methods *****/

	setCurrentView: function (/* dojoc.dojocal.views.ViewMixin|String */ newView) {
		// summary: switches the grid to the new viewMode
		//
		// newView: dojoc.dojocal.views.ViewMixin|String
		// a reference to a contained view (or the name of one)
		var oldView = this.currentView;
		this.currentView = dojo.isString(newView) ? this._findView(newView) : newView;
		this._switchView(oldView, this.currentView, true);
	},

	// TODO: add methods to get, add, and remove views

	setDate: function (/* Date|String? */ date) {
		// summary: sets the new date for the grid and adjust the views accordingly
		if (!date)
			date = new Date();
		else if (dojo.isString(date))
			date = new Date(date);

//		var prevDate = this.date,
//			prevWeekStartDate = this._weekStartDate,
//			prevMonthStartDate = this._monthStartDate;
//		this.date = date = djc.dateOnly(date);
//
//		// TODO: remove this block?
//		// calc start dates for multi-day views (week, month)
//		this._weekStartDate = dojo.date.add(date, 'day', -date.getDay() + this.weekStartsOn);
//		if (this._weekStartDate.getMonth() != date.getMonth()) // week started in the prev month
//			this._monthStartDate = this._weekStartDate;
//		else
//			this._monthStartDate = dojo.date.add(this._weekStartDate, 'day', -Math.ceil((this._weekStartDate.getDate() - 1) / 7) * 7);

		// reload all events into views
		dojo.forEach(this._views, function (view) { view.setDate(date); });
		this._loadEventsIntoViews(this._calendars);
	},

	setStartOfDay: function (/* Number */ minuteOfDay) {
		// summary: scrolls the top of the time-based views to the hour of the day specified.
		// minuteOfDay: Number
		//   the minute of the day. e.g. 450 (min) == 7.5 (hr) * 60 == 7:30 am
		// TODO: allow user to pass "auto" to try to scroll as many imminent events into current view???
		dojo.publish('dojoc.dojocal.' + this.widgetid + '.setStartOfDay', [minuteOfDay]);
	},

	getStartOfDay: function (/* Boolean? */ exact) {
		// summary: returns the minute of the day to which the first time-based view is currently scrolled
		//   (see setStartOfDay)
		// exact: set to true to return as precise a result as possible, omit or set to false to return the value
		//   rounded to the nearest minute
		// TODO: redo this using dojo.publish?
		var result;
		dojo.some(this._views, function (view) {
			return result = view.getStartOfDay(exact);
		});
		return result;
	},

	addCalendar: function (/* dojoc.dojocal.UserCalendar */ calendar) {
		// summary:
		// adds a manually-created (non-data-store) calendar of events to the grid
		// and automatically shows pertinent events in the views
		this._calendars.push(calendar);
		this.connect(calendar, 'onChangeEvent', '_onCalendarChangeEvent');
		var eventClass = calendar.defaultEventClass || this.defaultEventClass;
		// initialize events
		dojo.forEach(calendar.getEvents(), function (event, i) {
			// assign an id if not already assigned (this may not be foolproof)
			// no uid will break write-capable datastore - mtyson
			if (!('uid' in event.data))
				event.data.uid = calendar.id + '_' + i;
			// use dojo['require'] instead of dojo.require to prevent the build system from trying to bake-in anything
			// TODO: is the right way to ensure we have this class loaded?
			dojo['require'](event.options.eventClass || eventClass);

			// not sure if this is how the event was intended to bubble - mtyson
			//this.connect(event, 'onDataChange', '_onEventDataChange');
		});
		this._loadEventsIntoViews([calendar]);
	},

	removeCalendar: function (/* dojoc.dojocal.UserCalendar|String */ calendarOrId) {
		// summary:
		// manually removes a caendar of events and automatically removes the events
		// from all of the views
		var pos = this._findCalendarPos(calendarOrId);
		this._calendars.splice(pos, 1);
		// TODO: remove event widgets from views
	},

	/***** overrides *****/

	postCreate: function () {
//console.log('grid postCreate')
		this.inherited(arguments);
		// collections
		this._calendars = [];
		// make all text unselectable (event widgets should make their text selectable only when/if they are being edited in-place)
		// TODO: move this to the views
		dojo.setSelectable(this.domNode, false);
		// subscribe to topics
		// note, widgetid is undefined (running against 1.1.1)
		// Distinguish between adding and updating events
		dojo.subscribe('dojoc.dojocal.' + (this.widgetid || this.id) + '.eventAdded', this, '_onEventAdded');
		dojo.subscribe('dojoc.dojocal.' + (this.widgetid || this.id) + '.eventUpdated', this, '_onEventDataChange');
		if (this.store){
			this.store.fetch({onComplete: this._onDataLoaded, scope: this});
		}
	},

	/**
	 * Callback executed after the data store has finished loading the data.
	 */
	_onDataLoaded: function(items, request){
		console.log("Number of items located: " + items.length);
		// TODO: Move this into dojoc.dojocal.UserCalendar, or make UserCalendar able to handle the JSON object,
		// so we don't have to programmatically re-add the events to a cal object
		var count = 0;
		for (var x in items){
			var item = items[x];
			var newCal =
				new dojoc.dojocal.UserCalendar({id: item.uid, color: '#661100', fontColor: '#665500'}); // TODO: Maybe move UserCalendar.id to .uid to follow iCal spec?
			newCal.defaultEventClass = 'dojoc.dojocal.InplaceEditableEvent';
			newCal.addEvents(item.children);
			this.addCalendar(newCal);
			count++;
		}
		//this._loadEventsIntoViews(cals);
	},

	startup: function () {
//console.log('startup')
		this.inherited(arguments);
		// gather views
		// TODO: ensure that we have no duplicate views (by view.name)?
		this._views = this.getChildren();
		dojo.forEach(this._views, function (view) {
			dojo.style(view.domNode, 'visibility', 'hidden');
			view.gridId = this.widgetid || this.id; // widgetid is undefined - mtyson
		}, this);
		// clean up the date property (and set all date-related element texts)
		this.setDate(this.date);
		// set the initial view
		this.currentView = this._views.sort(function (a, b) { return b.selected > a.selected; })[0];
//console.log('here', this.currentView, this._views)
		this._switchView(null, this.currentView, false);
		// create periodic updater
		this._updaterTimer = setInterval(dojo.hitch(this, this._updateToCurrentTime), 5000);
		this.setStartOfDay(this.initialStartTime);
		this._updateToCurrentTime();
	},

	destroy: function () {
		clearInterval(this._updaterTimer);
		this.inherited(arguments);
	},

	_fillContent: function(/*DomNode*/ source){
		// override _Templated._fillContent to cascade shared properties to views before they are constructed
		// TODO: is there a better dojo way to do this? --> yes, defer view rendering to startup and request properties?
		var props = {},
			attrs = dojoc.dojocal._base.ViewMixin.prototype.cascadeAttrMap,
			_this = this;
		for (var attr in attrs) {
			props[attr] = _this[attr];
		}
		var dest = this.containerNode;
		if (source && dest) {
			while (source.hasChildNodes()) {
				var child = source.firstChild;
				if (child.nodeType == 1) {
					// add attributes to view nodes
					for (var p in props) {
						var value = props[p].toString();
						if (typeof value != "object" && value !== "" && value !== false && !dojo.hasAttr(child, p))
							dojo.attr(child, p, value);
					}
				}
				dest.appendChild(child);
			}
		}
	},

	/***** visualization methods *****/

	_updateToCurrentTime: function () {
		// TODO: use dojo.publish instead of this and remove stub from ViewMixin
		dojo.forEach(this._views, function (view) {
			view.updateTimeOfDay();
		});
	},

	/* methods to add/remove/update event widgets */

	_onEventAdded: function (eWidget, view) {
		// listen for event changes,
		this.connect(eWidget, 'onDataChange', this, "_onEventDataChange"); //dojo.hitch(this, '_onEventDataChange', eventWidget));
	},

	_onEventRemoved: function (eWidget, view) {
		// TODO
	},

	_loadEventsIntoViews: function (/* Array */ calendars) {
		dojo.forEach(this._views, function (view) {
			dojo.forEach(calendars, function (calendar) {
				var events = calendar.getEvents(view.getStartDate(), view.getEndDate());
				view.addEvents(events, calendar);
			});
		});
	},

	/***** other methods *****/

	_findCalendarById: function (id) {
		var pos = this._findCalendarPos(id);
		return pos >= 0 ? this._calendars[pos] : null;
	},

	_findCalendarPos: function (/* dojoc.dojocal.UserCalendar|String */ which) {
		var findBy = typeof which == 'string' ? 'id' : 'ref',
			found = -1;
		dojo.some(this._calendars, function (cal, pos) {
			if ((findBy == 'id' && cal.id == which) || (findBy == 'ref' && cal == which))
				found = pos;
			return found >= 0;
		});
		return found;
	},

	_findView: function (viewName) {
		var result = null;
		dojo.some(this._views, function (view) {
			return result = (view.name == viewName) ? view : null;
		});
		return result;
	},

	_switchView: function (oldView, newView, animate) {
		if (oldView != newView) {
			if (oldView) {
				var time = oldView.getStartOfDay(true);
				if (time !== null)
					dojo.publish('dojoc.dojocal.' + this.widgetid + '.setStartOfDay', [time]);
			}
			var oldNode = oldView && oldView.domNode,
				newNode = newView.domNode;
			// check if we're animating or not
			if (!animate || this._transitionViews(oldView, newView, oldNode, newNode) === false) {
				if (oldNode) {
					dojo.style(oldNode, 'zIndex', 0);
					dojo.style(oldNode, 'visibility', 'hidden');
				}
				if (newNode) {
					dojo.style(newNode, 'visibility', 'visible');
					dojo.style(newNode, 'zIndex', 1);
				}
			}
		}
	},

	_transitionViews: function (oldMode, newMode, oldNode, newNode) {
		// TODO: finish _transitionsViews() by creating a property to specify fadeIn, wipeIn, etc.
		// TODO: stop any current animation before starting new one!
		return false;
	},

	/***** internal event handlers ****/

	_onCalendarChangeEvent: function (event, changeType) {
		if (changeType == 'add') {
			// TODO:
			// create widgets for day, week, and month views
			// store in local cache????
		}
		else if (changeType == 'remove') {
			// TODO:
			// destroy widgets for day, week, and month views
			// remove from local cache????
		}
	},

	_onEventDataChange: function (eventWidget) {
		console.debug("EVENT CHANGE: " + eventWidget);
		if (this.store){
			if (this.store.getFeatures()['dojo.data.api.Write']){
				// TODO: Very important: Improve the performance of updating event items.

				for (var i = 0; i < items.length; i++){
					this.store.setValue(item, "foo", ("bar" + 1));
				}
			}
		}
	}

});

})(); // end of closure for local variables