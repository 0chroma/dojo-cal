/*
	Copyright (c) 2004-2009, The Dojo Foundation
	All Rights Reserved.

	Licensed under the Academic Free License version 2.1 or above OR the
	modified BSD license. For more information on Dojo licensing, see:

		http://dojotoolkit.org/book/dojo-book-0-9/introduction/licensing
*/

/*
	Author: unscriptable
	Date: Dec 31, 2008
*/
dojo.provide('dojoc.dojocal.InplaceEditableEvent');

dojo.require('dojoc.dojocal.Event');

(function () { // closure for local variables

dojo.declare('dojoc.dojocal.InplaceEditableEvent', [dojoc.dojocal.Event], {
	/**
	 * summary:
	 * TODO: create an event that can be edited in-place
	 */

	postCreate: function () {
		this.inherited(arguments);
	},

	destroy: function () {
		this.inherited(arguments);
	}

});

})(); // end of closure for local variables
