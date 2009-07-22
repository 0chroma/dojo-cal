/*
	Copyright (c) 2004-2009, The Dojo Foundation
	All Rights Reserved.

	Licensed under the Academic Free License version 2.1 or above OR the
	modified BSD license. For more information on Dojo licensing, see:

		http://dojotoolkit.org/book/dojo-book-0-9/introduction/licensing
*/

/*
	Author: unscriptable
	Date: Jan 31, 2009
	TODO: break the single methods into several methods
	TODO: figure out why this fails for groups with common events some times
	TODO: change this to work with the event data rather than the event nodes?
		- using the data means calculating once for all applicable views
		- using the nodes means that visual variations in event widgets are accommodated
*/
dojo.provide('dojoc.dojocal._base.EventPositioner');

dojo.require('dojoc.dojocal._base.common');

(function () { // closure for local variables

var djc = dojoc.dojocal;

/**
 * dojoc.dojocal._base.EventPositioner
 */
dojo.declare('dojoc.dojocal._base.EventPositioner', [], {

	checkOverlappingEvents: function (/* Array */ eventWidgets) {

		// summary:
		//   finds overlapped event widgets and separates them horizontally
		// eventWidgets:
		//   an array of the event widgets to position
		// returns:
		//   an array of objects: {widget: Event, box: OffsetBox, newBox: OffsetBox}
		// TODO: make this work with multi-day events (does it already work?)

		if (eventWidgets) {
			// an eGroup is an object: {intersection: OffsetBox, data: []}
			var eData = [], // returned data for each event widget
				eGroups = []; // overlapped groups

			// loop through all event widget nodes to assign them to overlapping groups
			eventWidgets.forEach(function (eWidget) {
				// create a box for this event node in %, not px
				var box = djc.getNodeBox(eWidget, true),
					datum = {widget: eWidget, box: box};
				// normalize left and width (to ignore any previous attempts to accommodate overlapping)
				// and make height 0.01% smaller to prevent box math from assuming touching == intersecting
				box.moveTo(0, null).sizeTo(100, box.h - 0.0001);
				// for each previously found event widget
				dojo.forEach(eData, function (eDatum) {
					// check if this one overlaps
					if (box.intersects(eDatum.box)) {
//console.log('box intersected: ', box, eDatum.box)
						// check if we're clustered with any known groups
						var groupCount = 0;
						dojo.forEach(eGroups, function (group) {
//console.log('group intersected: ', group.intersection, box)
							// is event within this group?
							if (group.intersection.intersects(box)) {
//console.log('intersected')
								// add event data to group if it's not already added
								// TODO: is there a way to restructure this algorithm so that we don't have to make this check?
								if (dojo.indexOf(group.data, datum) < 0)
									group.data.push(datum);
								group.intersection = djc.OffsetBox.getIntersection(group.intersection, box);
								groupCount++;
							}
						});
						// if we didn't find any groups
						if (groupCount == 0) {
							// create a new group
							eGroups.push({
								intersection: djc.OffsetBox.getIntersection(eDatum.box, box),
								data: [eDatum, datum]
							});
						}
					}
				});
				// add to the lists
				eData.push(datum);
			});
//console.log('eData: ')
//console.dir(eData);
//console.log('eGroups: ')
//console.dir(eGroups);
			// OK, we have all of the clusters / groupings.
			// Now, we assign each event a new box within the group
			// First: sort biggest to smallest so that more congested groups are done first
			eGroups.sort(function (a, b) { return a.data.length - b.data.length; });
			dojo.forEach(eGroups, function (group) {
				// Create new boxes for this group, one for each event in the group
				// The following formulas seem to work well for width and position/spacing.
				// Using spacing == 1 / size allows us to use CSS to stretch the events between
				// overlapped and end-to-end mode (when there is room for this mode).
				// Notice that the anchor property for the event depends on its position: events on
				// the right of center are anchored on the right.
				// All calculations are in percent (%)
				var existingNewBoxes = dojo.map(group.data, function (datum) { return datum.newBox; }),
					size = group.data.length,
					newSpacing = 1 / size * 100,
					newWidth = 2 / (size + 1) * 100,
					newBoxes = dojo.map(group.data, function (datum, i) {
						var anchor = (i / size < 0.5) ? 'l' : 'r',
							offset = (anchor == 'l' ? i : i + 1) * newSpacing,
							newBox = new djc.OffsetBox({
								l: (anchor == 'l') ? offset : (offset - newWidth),
								t: 0, // (arbitrary since we'll be using widths only from here)
								w: newWidth,
								h: 100 // (arbitrary)
							});
						newBox.anchor = anchor;
						newBox.spacing = newSpacing;
						// determine how much new box overlaps any existing new boxes for these events (created in a previous group)
						newBox.overlap = djc.OffsetBox.getIntersection.apply(this, existingNewBoxes.concat([newBox])).w;
						return newBox;
					});
//console.log('new boxes: ');
//console.dir(newBoxes)
				// sort by most overlapped to least (since we'll be popping them off)
				newBoxes.sort(function (a, b) { return (b.overlap - a.overlap); });
//console.log('sorted: ', newBoxes)
				// assign a new box to each event in the group
				dojo.forEach(group.data, function (datum) {
					// as long as it doesn't already have one from a more congested group
//console.log('assigning a new box: ', datum.newBox, newBoxes[newBoxes.length - 1]);
					if (!datum.newBox) {
						datum.newBox = newBoxes.pop();
					}
				});
			});
		}

		return eData;
//console.log('end: ', (new Date()).getMilliseconds())
	},

	checkOverlappingDayEvents: function (/* Array */ eventWidgets, /* Date*/ startDate, /* Integer */ numDays) {
		// summary:
		//   finds overlapped event widgets and separates them vertically
		// eventWidgets:
		//   an array of the event widgets to position
		// returns:
		//   an array of objects: {widget: Event, box: OffsetBox, newBox: OffsetBox}
//console.log('checkOverlappingDayEvents: ', arguments)
		if (eventWidgets) {
			// check that startDate has no time
			startDate = dojoc.dojocal.dateOnly(startDate);
			// setOf creates a "set" of days to fill with events
			function setOf (length, isFilled) {
				// using strings for sets for native-speed comparisons later
				// using this routine instead of dojo.string.pad for speed (and optimized for 7-day sets)
				var _base = isFilled ? '1111111' : '0000000', set = _base;
				while (set.length < length) set += _base;
				if (set.length > length) set = set.substr(0, length);
				return set;
			}
			// isOpenInSet checks if there is an open subset at the given positions
			function isOpenInSet (set, startPos, endPos) {
				return parseInt(set.substr(startPos, endPos - startPos + 1)) == 0
			}
			// fillSet fills the given set from startPos to endPos
			function fillSet (set, startPos, endPos) {
				return (set = set.substr(0, startPos) + setOf(endPos - startPos + 1, true) + set.substr(endPos + 1));
			}

			var eData = [], // the return data
				baseSet = setOf(numDays),
				// create a matrix of positions filled by the events. start with only one row
				dayMatrix = [baseSet],
				mruWidget, // most recently used widget
				mruRow; // most recently used row

			// sort events by size (multi-day events at the top) and then by time (for the month view)
			// and by unique ids which helps detect and process duplicates (below)
			eventWidgets = eventWidgets.sort(function (a, b) {
				var test = b.isAllDay() == a.isAllDay() ? 0 : b.isAllDay() ? 1 : -1;
				if (test == 0) {
					test = b.getDuration() - a.getDuration();
					if (test == 0) {
						test = b.getDateTime() - a.getDateTime();
						if (test == 0) {
							test = b.getUid() == a.getUid() ? 0 : b.getUid() < a.getUid() ? 1 : -1;
						}
					}
				}
				return test;
			});

			// place events into matrix
			dojo.forEach(eventWidgets, function (eWidget, i) {

				// is this a duplicate (multi-day events)
				if (!mruWidget || eWidget.calendarId != mruWidget.calendarId || eWidget.data.uid != mruWidget.data.uid) {

					// get positions of startDate and endDate within daySet
					// Note: this logic assumes that the event widget is being placed into the correct week/month! (TODO? fix?)
					var pStart = Math.min(numDays - 1, Math.max(0, dojo.date.difference(startDate, djc.dateOnly(eWidget.getDateTime()), 'day'))),
						pEnd = Math.min(numDays - 1, Math.max(0, dojo.date.difference(startDate, djc.dateOnly(eWidget.getEndDateTime()), 'day'))),
						row = -1; // row in which to place this event
//console.log(pStart, pEnd, eWidget.summary);
					// look for a place to put the event
					dojo.some(dayMatrix, function (daySet, i) {
						// check for room in this daySet
						if (isOpenInSet(daySet, pStart, pEnd)) {
							row = i;
//console.log('found space in row: ', row);
							return true;
						}
					});

					// if no place was found
					if (row < 0) {
						// create a new row
						row = dayMatrix.length;
						dayMatrix[row] = setOf(numDays);
					}
//console.log(pStart, pEnd, row, dayMatrix[row], eWidget, eWidget.domNode)
					// insert event into daySet
					var daySet = dayMatrix[row];
					dayMatrix[row] = fillSet(dayMatrix[row], pStart, pEnd);

					mruRow = row;
					mruWidget = eWidget;

				}
				// otherwise, this is a duplicate from multi-day events
				else {

					// used most recently-calculated row
					row = mruRow;

				}

				// set each widget's new position as determined by where it was placed and add to eData colection
				var box = djc.getNodeBox(eWidget.domNode),
					newBox = new djc.OffsetBox(box);
				newBox.moveTo(null, row * box.h);
				eData.push({widget: eWidget, box: box, newBox: newBox});

			});
//console.dir(dayMatrix);
		}

		return eData;
	}

});

})(); // end of closure for local variables
