dojo.provide("dojox.data.iCalStore");

dojo.require("dojo.data.util.simpleFetch");
dojo.require("dojo.data.util.filter");
dojo.require("dojo.date.stamp");
dojo.require("dojo.date.locale");

(function(){
	dojo.declare("dojox.data.iCalStore", null, {


		url: null,

		text: null,
		
		dateFormat: "",

		attrAlias: {
			dtstart: "startDate",
			enddate: "endDate"
		},

		//	summary:
		//		A read only data store for iCalendar documents
		//	description:
		//		A data store for iCalendar documents.

		constructor: function(/* object */ args) {
			//	summary:
			//		Constructor for the iCalendar store.
			//	args:
			//		An anonymous object to initialize properties.  It expects the following values:
			//		url:			The url to an iCalendar document. This should not be specified if 'text' is specified.
			//		text:			The text of the iCal document. This should not be specified if 'url' is specified.

			if(args){
				if (args.url && args.text) {
					throw new Error(this.declaredClass
						+ ": Only one of url and text can be specified")
				}
				this.url = args.url;
				this.text = args.text;
			}
			if(!this.url && !this.text){
				throw new Error(this.declaredClass
					+ ": a URL or text document must be specified when creating the data store");
			}
		},

		//Values that may be set by the parser.
		//Ergo, have to be instantiated to something
		//So the parser knows how to set them.
		url: "",

		label: "summary",

		/* dojo.data.api.Read */
		getValue: function(/* item */ item, /* attribute || attribute-name-string */ attribute, /* value? */ defaultValue){
			//	summary:
			//		Return an attribute value
			//	description:
			//		'item' must be an instance of an object created by the iCalStore instance.
			//		Accepted attributes are id, subtitle, title, summary, content, author, updated,
			//		published, category, link and alternate
			//	item:
			//		An item returned by a call to the 'fetch' method.
			//	attribute:
			//		A attribute of the Atom Entry
			//	defaultValue:
			//		A default value
			//	returns:
			//		An attribute value found, otherwise 'defaultValue'
			
			var values = this.getValues(item, attribute, defaultValue);
			
			return values && values.length > 0 ? values[0] : undefined;
		},

		getValues: function(/* item */ item, /* attribute || attribute-name-string */ attribute){
			//	summary:
			//		Return an attribute value
			//	description:
			//		'item' must be an instance of an object created by the iCalStore instance.
			//		Accepted attributes are id, subtitle, title, summary, content, author, updated,
			//		published, category, link and alternate
			//	item:
			//		An item returned by a call to the 'fetch' method.
			//	attribute:
			//		A attribute of the Atom Entry
			//	returns:
			//		An array of values for the attribute value found, otherwise 'defaultValue'
			this._assertIsItem(item);
			this._assertIsAttribute(attribute);
			this._initItem(item);
			attribute = attribute.toLowerCase();
			
			switch(attribute) {
				case "type":
					return item.name ? [item.name]: [];
				case "startdate":
				case "dtstart":
				  return item.startDate ? [item.startDate] : [];
				case "enddate":
				case "dtend":
					return item.endDate ? [item.endDate] : [];
				case "summary":
				  return item.summary ? [item.summary.value]: [];
				case "description":
					return item.description ? [item.description] : [];
				default: 
					if (item[attribute]) {
						if (dojo.isString(item[attribute])) {
							return [item[attribute]];
						} else if(item[attribute].value) {
							return [item[attribute].value];
						}
					}
			}
			
			return [];
		},

		getAttributes: function(/* item */ item) {
			//	summary:
			//		Return an array of attribute names
			// 	description:
			//		'item' must be have been created by the iCalStore instance.
			//		tag names of child elements and XML attribute names of attributes
			//		specified to the element are returned along with special attribute
			//		names applicable to the element including "tagName", "childNodes"
			//		if the element has child elements, "text()" if the element has
			//		child text nodes, and attribute names in '_attributeMap' that match
			//		the tag name of the element.
			//	item:
			//		An XML element
			//	returns:
			//		An array of attributes found
			this._assertIsItem(item);
			
			var attrNames = [];
			var _this = this;
			var getAttrName = function(attr) {
				return _this.attrAlias[attr.name] || attr.name;
			}
			
			dojo.forEach(item._ValidProperties, dojo.hitch(this, function(attr){
				//console.log("checking attr", attr);
				
				if (dojo.isArray(attr)) {
					dojo.forEach(attr, function(attr){
						var val = getAttrName(attr);
						if (_this.hasAttribute(item, val)) {
							attrNames.push(val);
						} else {
							console.log("no attr " + val + " in ", item);
						}
					});
				}
				else {
					var val = getAttrName(attr);
					if (_this.hasAttribute(item, val)) {
						attrNames.push(val);
					} else {
						console.log("no attr " + val + " in ", item);
					}
				}
			}));
			return attrNames; //array
		},

		hasAttribute: function(/* item */ item, /* attribute || attribute-name-string */ attribute){
			//	summary:
			//		Check whether an element has the attribute
			//	item:
			//		'item' must be created by the iCalStore instance.
			//	attribute:
			//		An attribute of an Atom Entry item.
			//	returns:
			//		True if the element has the attribute, otherwise false
			return (this.getValue(item, attribute) !== undefined); //boolean
		},

		containsValue: function(/* item */ item, /* attribute || attribute-name-string */ attribute, /* anything */ value){
			//	summary:
			//		Check whether the attribute values contain the value
			//	item:
			//		'item' must be an instance of a dojox.data.XmlItem from the store instance.
			//	attribute:
			//		A tag name of a child element, An XML attribute name or one of
			//		special names
			//	returns:
			//		True if the attribute values contain the value, otherwise false
			var values = this.getValues(item, attribute);
			for(var i = 0; i < values.length; i++){
				if((typeof value === "string")){
					if(values[i].toString && values[i].toString() === value){
						return true;
					}
				}else if (values[i] === value){
					return true; //boolean
				}
			}
			return false;//boolean
		},

		isItem: function(/* anything */ something){
			//	summary:
			//		Check whether the object is an item (XML element)
			//	item:
			//		An object to check
			// 	returns:
			//		True if the object is an XML element, otherwise false
			if(something && something.store && something.store === this){
				return true; //boolean
			}
			return false; //boolran
		},

		isItemLoaded: function(/* anything */ something){
			//	summary:
			//		Check whether the object is an item (XML element) and loaded
			//	item:
			//		An object to check
			//	returns:
			//		True if the object is an XML element, otherwise false
			return this.isItem(something); //boolean
		},

		loadItem: function(/* object */ keywordArgs){
			//	summary:
			//		Does nothing.
			//	keywordArgs:
			//		object containing the args for loadItem.  See dojo.data.api.Read.loadItem()
		},

		getFeatures: function() {
			//	summary:
			//		Return supported data APIs
			//	returns:
			//		"dojo.data.api.Read" and "dojo.data.api.Write"
			var features = {
				"dojo.data.api.Read": true
			};
			return features; //array
		},

		getLabel: function(/* item */ item){
			//	summary:
			//		See dojo.data.api.Read.getLabel()
			if((this.label !== "") && this.isItem(item)){
				var label = this.getValue(item,this.label);
				if(label && label.text){
					return label.text;
				}else if (label){
					return label.toString();
				}else{
					return undefined;
				}
			}
			return undefined; //undefined
		},

		getLabelAttributes: function(/* item */ item){
			//	summary:
			//		See dojo.data.api.Read.getLabelAttributes()
			if(this.label !== ""){
				return [this.label]; //array
			}
			return null; //null
		},

		_initItem: function(item){
			// summary:
			//		Initializes an item before it can be parsed.
			if(!item._attribs){
				item._attribs = {};
			}
		},

		_fetchItems: function(request, fetchHandler, errorHandler) {
			// summary:
			//		Retrieves the items from the Atom XML document.
			var url = this.url;
			var localRequest = (!this.sendQuery ? request : null); // use request for _getItems()

			var _this = this;
			var docHandler = function(data){
				if (!_this.text) {
					_this.text = data;
				}
				var items = _this._getItems(data, localRequest);

				if(request.onBegin){
					request.onBegin(items ? items.length : 0, request);
				}

				var query = request.query;
//				if(query) {
//					if(query.id) {
//						items = dojo.filter(items, function(item){
//							return (_this.getValue(item, "id") == query.id);
//						});
//					} else if(query.category){
//						items = dojo.filter(items, function(entry) {
//							var cats = _this.getValues(entry, "category");
//							if(!cats){
//								return false;
//							}
//							return dojo.some(cats, "return item.term=='"+query.category+"'");
//						});
//					}
//				}

				if (items && items.length > 0) {
					fetchHandler(items, request);
				}
				else {
					fetchHandler([], request);
				}
			};

			if (this.text) {
				docHandler(this.text);
			}else{
				var getArgs = {
					url: url,
					handleAs: "text"//,
				//	preventCache: true
				};
				var getHandler = dojo.xhrGet(getArgs);
				getHandler.addCallback(docHandler);

				getHandler.addErrback(function(data){
					errorHandler(data, request);
				});
			}
		},

		_getItems: function(document, request) {
			// summary:
			//		Parses the document in a first pass
			if(this._items){
				return this._items;
			}
			var calInfo = cal.iCalendar.fromText(document);

			var items;
			if (calInfo.length > 0) {
				items = calInfo[0].components;
			}

			this._items = items || [];
			var store = this;
			dojo.forEach(this._items, function(item){
				item.store = store;
			});
			
			return items;
		},

		close: function(/*dojo.data.api.Request || keywordArgs || null */ request){
			 //	summary:
			 //		See dojo.data.api.Read.close()
		},

	/* internal API */

		_getItem: function(element){
			return {
				element: element,
				store: this
			};
		},

		_parseItem: function(item) {
			var attribs = item._attribs;
			var _this = this;
			var text, type;

			function getNodeText(node){
				var txt = node.textContent || node.innerHTML || node.innerXML;
				if(!txt && node.childNodes[0]){
					var child = node.childNodes[0];
					if (child && (child.nodeType == 3 || child.nodeType == 4)) {
						txt = node.childNodes[0].nodeValue;
					}
				}
				return txt;
			}
			function parseTextAndType(node) {
				return {text: getNodeText(node),type: node.getAttribute("type")};
			}
			dojo.forEach(item.element.childNodes, function(node){
				var tagName = node.tagName ? node.tagName.toLowerCase() : "";
				switch(tagName){
					case "title":
						attribs[tagName] = {
							text: getNodeText(node),
							type: node.getAttribute("type")
						}; break;
					case "subtitle":
					case "summary":
					case "content":
						attribs[tagName] = parseTextAndType(node);
						break;
					case "author":
						var nameNode ,uriNode;
						dojo.forEach(node.childNodes, function(child){
							if(!child.tagName){
								return;
							}
							switch(child.tagName.toLowerCase()){
								case "name":nameNode = child;break;
								case "uri": uriNode = child; break;
							}
						});
						var author = {};
						if(nameNode && nameNode.length == 1){
							author.name = getNodeText(nameNode[0]);
						}
						if(uriNode && uriNode.length == 1){
							author.uri = getNodeText(uriNode[0]);
						}
						attribs[tagName] = author;
						break;
					case "id": attribs[tagName] = getNodeText(node); break;
					case "updated": attribs[tagName] = dojo.date.stamp.fromISOString(getNodeText(node) );break;
					case "published": attribs[tagName] = dojo.date.stamp.fromISOString(getNodeText(node));break;
					case "category":
						if(!attribs[tagName]){
							attribs[tagName] = [];
						}
						attribs[tagName].push({scheme:node.getAttribute("scheme"), term: node.getAttribute("term")});
						break;
					case "link":
						if(!attribs[tagName]){
							attribs[tagName] = [];
						}
						var link = {
							rel: node.getAttribute("rel"),
							href: node.getAttribute("href"),
							type: node.getAttribute("type")};
						attribs[tagName].push(link);

						if(link.rel == "alternate") {
							attribs["alternate"] = link;
						}
						break;
					default:
						break;
				}
			});
		},

		_unescapeHTML : function(text) {
			//Replace HTML character codes with their unencoded equivalents, e.g. &#8217; with '
			text = text.replace(/&#8217;/m , "'").replace(/&#8243;/m , "\"").replace(/&#60;/m,">").replace(/&#62;/m,"<").replace(/&#38;/m,"&");
			return text;
		},

		_assertIsItem: function(/* item */ item){
			//	summary:
			//		This function tests whether the item passed in is indeed an item in the store.
			//	item:
			//		The item to test for being contained by the store.
			if(!this.isItem(item)){
				throw new Error("dojox.data.iCalStore: Invalid item argument.");
			}
		},

		_assertIsAttribute: function(/* attribute-name-string */ attribute){
			//	summary:
			//		This function tests whether the item passed in is indeed a valid 'attribute' like type for the store.
			//	attribute:
			//		The attribute to test for being contained by the store.
			if(typeof attribute !== "string"){
				debugger;
				throw new Error("dojox.data.iCalStore: Invalid attribute argument.");
			}
		}
	});
	dojo.extend(dojox.data.iCalStore,dojo.data.util.simpleFetch);

var normalizeNewlines = function(/*string*/text, /*string? (\n or \r)*/newlineChar){
// summary:
//	Changes occurences of CR and LF in text to CRLF, or if newlineChar is provided as '\n' or '\r',
//	substitutes newlineChar for occurrences of CR/LF and CRLF

	if (newlineChar == "\n"){
		text = text.replace(/\r\n/g, "\n");
		text = text.replace(/\r/g, "\n");
	} else if (newlineChar == "\r"){
		text = text.replace(/\r\n/g, "\r");
		text = text.replace(/\n/g, "\r");
	}else{
		text = text.replace(/([^\r])\n/g, "$1\r\n").replace(/\r([^\n])/g, "\r\n$1");
	}
	return text; // string
}

var splitEscaped = function(/*string*/str, /*string of length=1*/charac){
// summary:
//	Splits 'str' into an array separated by 'charac', but skips characters escaped with a backslash

	var components = [];
	for (var i = 0, prevcomma = 0; i < str.length; i++){
		if (str.charAt(i) == '\\'){ i++; continue; }
		if (str.charAt(i) == charac){
			components.push(str.substring(prevcomma, i));
			prevcomma = i + 1;
		}
	}
	components.push(str.substr(prevcomma));
	return components; // array
}

var cal = {textDirectory: {}, iCalendar: {}};

cal.textDirectory.Property = function(/*String*/line){
// summary: parses a single line from an iCalendar text/directory file
// and creates an object with four named values; name, group, params
// and value. name, group and value are strings containing the original
// tokens unaltered and values is an array containing name/value pairs
// or a single name token packed into arrays.

	// split into name/value pair
	var left = dojo.trim(line.substring(0, line.indexOf(':')));
	var right = dojo.trim(line.substr(line.indexOf(':') + 1));

	// separate name and paramters
	var parameters = splitEscaped(left,';');
	this.name = parameters[0];
	parameters.splice(0, 1);

	// parse paramters
	this.params = [];
	var arr;
	for(var i = 0; i < parameters.length; i++){
		arr = parameters[i].split("=");
		var key = dojo.trim(arr[0].toUpperCase());

		if(arr.length == 1){ this.params.push([key]); continue; }

		var values = splitEscaped(arr[1],',');
		for(var j = 0; j < values.length; j++){
			if(dojo.trim(values[j]) != ''){
				this.params.push([key, dojo.trim(values[j])]);
			}
		}
	}

	// separate group
	if(this.name.indexOf('.') > 0){
		arr = this.name.split('.');
		this.group = arr[0];
		this.name = arr[1];
	}

	// don't do any parsing, leave to implementation
	this.value = right;
}


cal.textDirectory.tokenise = function(/*String*/text){
// summary: parses text into an array of properties.

	// normlize to one property per line and parse
	var nText = normalizeNewlines(text,"\n").
		replace(/\n[ \t]/g, '').
		replace(/\x00/g, '');

	var lines = nText.split("\n");
	var properties = [];

	for(var i = 0; i < lines.length; i++){
		if(dojo.trim(lines[i]) == ''){ continue; }
		var prop = new cal.textDirectory.Property(lines[i]);
		properties.push(prop);
	}
	return properties; // Array
}


cal.iCalendar.fromText =  function (/* string */text) {
	// summary
	// Parse text of an iCalendar and return an array of iCalendar objects

	var properties = cal.textDirectory.tokenise(text);
	var calendars = [];

	//dojo.debug("Parsing iCal String");
	for (var i = 0, begun = false; i < properties.length; i++) {
		var prop = properties[i];
		if (!begun) {
			if (prop.name == 'BEGIN' && prop.value == 'VCALENDAR') {
				begun = true;
				var calbody = [];
			}
		} else if (prop.name == 'END' && prop.value == 'VCALENDAR') {
			calendars.push(new cal.iCalendar.VCalendar(calbody));
			begun = false;
		} else {
			calbody.push(prop);
		}
	}
	return /* array */calendars;
}


cal.iCalendar.Component = function (/* string */ body ) {
	// summary
	// A component is the basic container of all this stuff.

	if (!this.name) {
		this.name = "COMPONENT"
	}

	this.properties = [];
	this.components = [];
	if (body) {
		for (var i = 0, context = ''; i < body.length; i++) {
			if (context == '') {
				if (body[i].name == 'BEGIN') {
					context = body[i].value;
					var childprops = [];
				} else {
					this.addProperty(new cal.iCalendar.Property(body[i]));
				}
			} else if (body[i].name == 'END' && body[i].value == context) {
				if (context=="VEVENT") {
					console.log("creating VEvent with props ", childprops);
					this.addComponent(new cal.iCalendar.VEvent(childprops));
				} else if (context=="VTIMEZONE") {
					this.addComponent(new cal.iCalendar.VTimeZone(childprops));
				} else if (context=="VTODO") {
					this.addComponent(new cal.iCalendar.VTodo(childprops));
				} else if (context=="VJOURNAL") {
					this.addComponent(new cal.iCalendar.VJournal(childprops));
				} else if (context=="VFREEBUSY") {
					this.addComponent(new cal.iCalendar.VFreeBusy(childprops));
				} else if (context=="STANDARD") {
					this.addComponent(new cal.iCalendar.Standard(childprops));
				} else if (context=="DAYLIGHT") {
					this.addComponent(new cal.iCalendar.Daylight(childprops));
				} else if (context=="VALARM") {
					this.addComponent(new cal.iCalendar.VAlarm(childprops));
				}else {
					dojo.unimplemented("cal.iCalendar." + context);
				}
				context = '';
			} else {
				childprops.push(body[i]);
			}
		}

		if (this._ValidProperties) {
			this.postCreate();
		}
	}
}

dojo.extend(cal.iCalendar.Component, {

	addProperty: function (prop) {
		// summary
		// push a new property onto a component.
		this.properties.push(prop);
		this[prop.name.toLowerCase()] = prop;
	},

	addComponent: function (prop) {
		// summary
		// add a component to this components list of children.
		this.components.push(prop);
	},

	postCreate: function() {
		for (var x = 0; x < this._ValidProperties.length; x++) {
			var evtProperty = this._ValidProperties[x];
			var found = false;
			
			function getFindFn(name){
		  	return function findName(prop){
		  		if (dojo.isArray(prop)) {
		  			return dojo.some(prop, findName);
		  		}
					return name == prop.name;
		  	}
		  }

			for (var y=0; y<this.properties.length; y++) {
				var prop = this.properties[y];
				var propName = prop.name.toLowerCase();
				if (dojo.isArray(evtProperty)) {
					var fn = getFindFn(propName);
					
					alreadySet = dojo.some(evtProperty, fn);
					
//					var alreadySet = false;
//					for (var z=0; z<evtProperty.length; z++) {
//						console.log("evtPropertyName[" + z + "] = ", evtProperty[z]);
//						var evtPropertyName = evtProperty[z].name.toLowerCase();
//						if((this[evtPropertyName])  && (evtPropertyName != propName)) {
//							alreadySet=true;
//						}
//					}
					if (!alreadySet) {
						this[propName] = prop;
					}
				} else {
					if (propName == evtProperty.name.toLowerCase()) {
						found = true;
						if (evtProperty.occurance == 1){
							this[propName] = prop;
						} else {
							found = true;
							if (!dojo.isArray(this[propName])) {
							 	this[propName] = [];
							}
							this[propName].push(prop);
						}
					}
				}
			}

			if (evtProperty.required && !found) {
				dojo.debug("iCalendar - " + this.name + ": Required Property not found: " + evtProperty.name);
			}
		}

		// parse any rrules
		if (dojo.isArray(this.rrule)) {
			for(var x=0; x<this.rrule.length; x++) {
				var rule = this.rrule[x].value;

				//add a place to cache dates we have checked for recurrance
				this.rrule[x].cache = function() {};

				var temp = rule.split(";");
				for (var y=0; y<temp.length; y++) {
					var pair = temp[y].split("=");
					var key = pair[0].toLowerCase();
					var val = pair[1];

					if ((key == "freq") || (key=="interval") || (key=="until")) {
						this.rrule[x][key]= val;
					} else {
						var valArray = val.split(",");
						this.rrule[x][key] = valArray;
					}
				}
			}
			this.recurring = true;
		}

	},

	toString: function () {
		// summary
		// output a string representation of this component.
		return "[iCalendar.Component; " + this.name + ", " + this.properties.length +
			" properties, " + this.components.length + " components]";
	}
});

cal.iCalendar.Property = function (prop) {
	// summary
	// A single property of a component.

	// unpack the values
	this.name = prop.name;
	this.group = prop.group;
	this.params = prop.params;
	this.value = prop.value;

}

dojo.extend(cal.iCalendar.Property, {
	toString: function () {
		// summary
		// output a string reprensentation of this component.
		return "[iCalenday.Property; " + this.name + ": " + this.value + "]";
	}
});

// This is just a little helper function for the Component Properties
var _P = function (n, oc, req) {
	return {name: n, required: (req) ? true : false,
		occurance: (oc == '*' || !oc) ? -1 : oc}
}


function inherits (/*Function*/subclass, /*Function*/superclass){
	// summary: Set up inheritance between two classes.
	if(!dojo.isFunction(superclass)){
		dojo.raise("inherits: superclass argument ["+superclass+"] must be a function (subclass: ["+subclass+"']");
	}
	subclass.prototype = new superclass();
	subclass.prototype.constructor = subclass;
	subclass.superclass = superclass.prototype;
	// DEPRECATED: super is a reserved word, use 'superclass'
	subclass['super'] = superclass.prototype;
}

/*
 * VCALENDAR
 */

cal.iCalendar.VCalendar = function (/* string */ calbody) {
	// summary
	// VCALENDAR Component

	this.name = "VCALENDAR";
	this.recurring = [];
	this.nonRecurringEvents = function(){};
	cal.iCalendar.Component.call(this, calbody);
}

inherits(cal.iCalendar.VCalendar, cal.iCalendar.Component);

dojo.extend(cal.iCalendar.VCalendar, {
	addComponent: function (prop) {
		// summary
		// add component to the calenadar that makes it easy to pull them out again later.
		this.components.push(prop);
		if (prop.name.toLowerCase() == "vevent") {
			if (prop.rrule) {
				this.recurring.push(prop);
			} else {
				var startDate = prop.getDate();
				var month = startDate.getMonth() + 1;
				var dateString= month + "-" + startDate.getDate() + "-" + startDate.getFullYear();
				if (!dojo.isArray(this[dateString])) {
					this.nonRecurringEvents[dateString] = [];
				}
				this.nonRecurringEvents[dateString].push(prop);
			}
		}
	},

	preComputeRecurringEvents: function(until) {
		var calculatedEvents = function(){};

		for(var x=0; x<this.recurring.length; x++) {
			var dates = this.recurring[x].getDates(until);
			for (var y=0; y<dates.length;y++) {
				var month = dates[y].getMonth() + 1;
				var dateStr = month + "-" + dates[y].getDate() + "-" + dates[y].getFullYear();
				if (!dojo.isArray(calculatedEvents[dateStr])) {
					calculatedEvents[dateStr] = [];
				}

				if (dojo.indexOf(calculatedEvents[dateStr], this.recurring[x]) < 0) {
					calculatedEvents[dateStr].push(this.recurring[x]);
				}
			}
		}
		this.recurringEvents = calculatedEvents;

	},

	getEvents: function(/* Date */ date) {
		// summary
		// Gets all events occuring on a particular date
		var events = [];
		var recur = [];
		var nonRecur = [];
		var month = date.getMonth() + 1;
		var dateStr= month + "-" + date.getDate() + "-" + date.getFullYear();
		if (dojo.isArray(this.nonRecurringEvents[dateStr])) {
			nonRecur= this.nonRecurringEvents[dateStr];
			dojo.debug("Number of nonRecurring Events: " + nonRecur.length);
		}


		if (dojo.isArray(this.recurringEvents[dateStr])) {
			recur= this.recurringEvents[dateStr];
		}

		events = recur.concat(nonRecur);

		if (events.length > 0) {
			return events;
		}

		return null;
	}
});

/*
 * STANDARD
 */

var StandardProperties = [
	_P("dtstart", 1, true), _P("tzoffsetto", 1, true), _P("tzoffsetfrom", 1, true),
	_P("comment"), _P("rdate"), _P("rrule"), _P("tzname")
];


cal.iCalendar.Standard = function (/* string */ body) {
	// summary
	// STANDARD Component

	this.name = "STANDARD";
	this._ValidProperties = StandardProperties;
	cal.iCalendar.Component.call(this, body);
}

inherits(cal.iCalendar.Standard, cal.iCalendar.Component);

/*
 * DAYLIGHT
 */

var DaylightProperties = [
	_P("dtstart", 1, true), _P("tzoffsetto", 1, true), _P("tzoffsetfrom", 1, true),
	_P("comment"), _P("rdate"), _P("rrule"), _P("tzname")
];

cal.iCalendar.Daylight = function (/* string */ body) {
	// summary
	// Daylight Component
	this.name = "DAYLIGHT";
	this._ValidProperties = DaylightProperties;
	cal.iCalendar.Component.call(this, body);
}

inherits(cal.iCalendar.Daylight, cal.iCalendar.Component);

/*
 * VEVENT
 */

var VEventProperties = [
	// these can occur once only
	_P("class", 1), _P("created", 1), _P("description", 1), _P("dtstart", 1),
	_P("geo", 1), _P("last-mod", 1), _P("location", 1), _P("organizer", 1),
	_P("priority", 1), _P("dtstamp", 1), _P("seq", 1), _P("status", 1),
	_P("summary", 1), _P("transp", 1), _P("uid", 1), _P("url", 1), _P("recurid", 1),
	// these two are exclusive
	[_P("dtend", 1), _P("duration", 1)],
	// these can occur many times over
	_P("attach"), _P("attendee"), _P("categories"), _P("comment"), _P("contact"),
	_P("exdate"), _P("exrule"), _P("rstatus"), _P("related"), _P("resources"),
	_P("rdate"), _P("rrule")
];

var setDayOfYear = function(/*Date*/dateObject, /*Number*/dayOfYear){
	// summary: sets dateObject according to day of the year (1..366)
	dateObject.setMonth(0);
	dateObject.setDate(dayOfYear);
	return dateObject; // Date
}

function parseDate(str) {
	var parts = str.split("T");
	str = parts[0];//str.replace("T", "").replace("Z", "");
	var time = parts[1];
	var dt = dojo.date.locale.parse(str, {datePattern: 'yyyyMMdd', selector: "date"});
	
	dt.setHours(Number(time.substring(0, 2)));
	dt.setMinutes(Number(time.substring(2, 4)));
	dt.setSeconds(Number(time.substring(4, 6)));
	return dt;
}

cal.iCalendar.VEvent = function (/* string */ body) {
	// summary
	// VEVENT Component
	this._ValidProperties = VEventProperties;
	this.name = "VEVENT";
	cal.iCalendar.Component.call(this, body);
	this.recurring = false;
	this.startDate = parseDate(this.dtstart.value);
}

inherits(cal.iCalendar.VEvent, cal.iCalendar.Component);

dojo.extend(cal.iCalendar.VEvent, {
		getDates: function(until) {
			var dtstart = this.getDate();

			var recurranceSet = [];
			var weekdays=["su","mo","tu","we","th","fr","sa"];
			var order = {
				"daily": 1, "weekly": 2, "monthly": 3, "yearly": 4,
				"byday": 1, "bymonthday": 1, "byweekno": 2, "bymonth": 3, "byyearday": 4};

			// expand rrules into the recurrance
			for (var x=0; x<this.rrule.length; x++) {
				var rrule = this.rrule[x];
				var freq = rrule.freq.toLowerCase();
				var interval = 1;

				if (rrule.interval > interval) {
					interval = rrule.interval;
				}

				var set = [];
				var freqInt = order[freq];

				if (rrule.until) {
					var tmpUntil = parseDate(rrule.until);//dojo.date.stamp.fromISOString(rrule.until);
				} else {
					var tmpUntil = until
				}

				if (tmpUntil > until) {
					tmpUntil = until
				}


				if (dtstart<tmpUntil) {

					var expandingRules = function(){};
					var cullingRules = function(){};
					expandingRules.length=0;
					cullingRules.length =0;

					switch(freq) {
						case "yearly":
							var nextDate = new Date(dtstart);
							set.push(nextDate);
							while(nextDate < tmpUntil) {
								nextDate.setYear(nextDate.getFullYear()+interval);
								tmpDate = new Date(nextDate);
								if(tmpDate < tmpUntil) {
									set.push(tmpDate);
								}
							}
							break;
						case "monthly":
							nextDate = new Date(dtstart);
							set.push(nextDate);
							while(nextDate < tmpUntil) {
								nextDate.setMonth(nextDate.getMonth()+interval);
								var tmpDate = new Date(nextDate);
								if (tmpDate < tmpUntil) {
									set.push(tmpDate);
								}
							}
							break;
						case "weekly":
							nextDate = new Date(dtstart);
							set.push(nextDate);
							while(nextDate < tmpUntil) {
								nextDate.setDate(nextDate.getDate()+(7*interval));
								var tmpDate = new Date(nextDate);
								if (tmpDate < tmpUntil) {
									set.push(tmpDate);
								}
							}
							break;
						case "daily":
							nextDate = new Date(dtstart);
							set.push(nextDate);
							while(nextDate < tmpUntil) {
								nextDate.setDate(nextDate.getDate()+interval);
								var tmpDate = new Date(nextDate);
								if (tmpDate < tmpUntil) {
									set.push(tmpDate);
								}
							}
							break;

					}

					if ((rrule["bymonth"]) && (order["bymonth"]<freqInt))	{
						for (var z=0; z<rrule["bymonth"].length; z++) {
							if (z==0) {
								for (var zz=0; zz < set.length; zz++) {
									set[zz].setMonth(rrule["bymonth"][z]-1);
								}
							} else {
								var subset=[];
								for (var zz=0; zz < set.length; zz++) {
									var newDate = new Date(set[zz]);
									newDate.setMonth(rrule[z]);
									subset.push(newDate);
								}
								tmp = set.concat(subset);
								set = tmp;
							}
						}
					}


					// while the spec doesn't prohibit it, it makes no sense to have a bymonth and a byweekno at the same time
					// and if i'm wrong then i don't know how to apply that rule.  This is also documented elsewhere on the web
					if (rrule["byweekno"] && !rrule["bymonth"]) {
						dojo.debug("TODO: no support for byweekno yet");
					}


					// while the spec doesn't prohibit it, it makes no sense to have a bymonth and a byweekno at the same time
					// and if i'm wrong then i don't know how to apply that rule.  This is also documented elsewhere on the web
					if (rrule["byyearday"] && !rrule["bymonth"] && !rrule["byweekno"] ) {
						if (rrule["byyearday"].length > 1) {
							var regex = "([+-]?)([0-9]{1,3})";
							for (var z=1; x<rrule["byyearday"].length; z++) {
								var regexResult = rrule["byyearday"][z].match(regex);
								if (z==1) {
									for (var zz=0; zz < set.length; zz++) {
										if (regexResult[1] == "-") {
											setDayOfYear(set[zz],366-regexResult[2]);
										} else {
											setDayOfYear(set[zz],regexResult[2]);
										}
									}
								}	else {
									var subset=[];
									for (var zz=0; zz < set.length; zz++) {
										var newDate = new Date(set[zz]);
										if (regexResult[1] == "-") {
											setDayOfYear(newDate,366-regexResult[2]);
										} else {
											setDayOfYear(newDate,regexResult[2]);
										}
										subset.push(newDate);
									}
									tmp = set.concat(subset);
									set = tmp;
								}
							}
						}
					}

					if (rrule["bymonthday"]  && (order["bymonthday"]<freqInt)) {
						if (rrule["bymonthday"].length > 0) {
							var regex = "([+-]?)([0-9]{1,3})";
							for (var z=0; z<rrule["bymonthday"].length; z++) {
								var regexResult = rrule["bymonthday"][z].match(regex);
								if (z==0) {
									for (var zz=0; zz < set.length; zz++) {
										if (regexResult[1] == "-") {
											if (regexResult[2] < dojo.date.getDaysInMonth(set[zz])) {
												set[zz].setDate(dojo.date.getDaysInMonth(set[zz]) - regexResult[2]);
											}
										} else {
											if (regexResult[2] < dojo.date.getDaysInMonth(set[zz])) {
												set[zz].setDate(regexResult[2]);
											}
										}
									}
								}	else {
									var subset=[];
									for (var zz=0; zz < set.length; zz++) {
										var newDate = new Date(set[zz]);
										if (regexResult[1] == "-") {
											if (regexResult[2] < dojo.date.getDaysInMonth(set[zz])) {
												newDate.setDate(dojo.date.getDaysInMonth(set[zz]) - regexResult[2]);
											}
										} else {
											if (regexResult[2] < dojo.date.getDaysInMonth(set[zz])) {
												newDate.setDate(regexResult[2]);
											}
										}
										subset.push(newDate);
									}
									tmp = set.concat(subset);
									set = tmp;
								}
							}
						}
					}

					if (rrule["byday"]  && (order["byday"]<freqInt)) {
						if (rrule["bymonth"]) {
							if (rrule["byday"].length > 0) {
								var regex = "([+-]?)([0-9]{0,1}?)([A-Za-z]{1,2})";
								for (var z=0; z<rrule["byday"].length; z++) {
									var regexResult = rrule["byday"][z].match(regex);
									var occurance = regexResult[2];
									var day = regexResult[3].toLowerCase();


									if (z==0) {
										for (var zz=0; zz < set.length; zz++) {
											if (regexResult[1] == "-") {
												//find the nth to last occurance of date
												var numDaysFound = 0;
												var lastDayOfMonth = dojo.date.getDaysInMonth(set[zz]);
												var daysToSubtract = 1;
												set[zz].setDate(lastDayOfMonth);
												if (weekdays[set[zz].getDay()] == day) {
													numDaysFound++;
													daysToSubtract=7;
												}
												daysToSubtract = 1;
												while (numDaysFound < occurance) {
													set[zz].setDate(set[zz].getDate()-daysToSubtract);
													if (weekdays[set[zz].getDay()] == day) {
														numDaysFound++;
														daysToSubtract=7;
													}
												}
											} else {
												if (occurance) {
													var numDaysFound=0;
													set[zz].setDate(1);
													var daysToAdd=1;

													if(weekdays[set[zz].getDay()] == day) {
														numDaysFound++;
														daysToAdd=7;
													}

													while(numDaysFound < occurance) {
														set[zz].setDate(set[zz].getDate()+daysToAdd);
														if(weekdays[set[zz].getDay()] == day) {
															numDaysFound++;
															daysToAdd=7;
														}
													}
												} else {
													//we're gonna expand here to add a date for each of the specified days for each month
													var numDaysFound=0;
													var subset = [];

													lastDayOfMonth = new Date(set[zz]);
													var daysInMonth = dojo.date.getDaysInMonth(set[zz]);
													lastDayOfMonth.setDate(daysInMonth);

													set[zz].setDate(1);

													if (weekdays[set[zz].getDay()] == day) {
														numDaysFound++;
													}
													var tmpDate = new Date(set[zz]);
													daysToAdd = 1;
													while(tmpDate.getDate() < lastDayOfMonth) {
														if (weekdays[tmpDate.getDay()] == day) {
															numDaysFound++;
															if (numDaysFound==1) {
																set[zz] = tmpDate;
															} else {
																subset.push(tmpDate);
																tmpDate = new Date(tmpDate);
																daysToAdd=7;
																tmpDate.setDate(tmpDate.getDate() + daysToAdd);
															}
														} else {
															tmpDate.setDate(tmpDate.getDate() + daysToAdd);
														}
													}
													var t = set.concat(subset);
													set = t;
												}
											}
										}
									}	else {
										var subset=[];
										for (var zz=0; zz < set.length; zz++) {
											var newDate = new Date(set[zz]);
											if (regexResult[1] == "-") {
												if (regexResult[2] < dojo.date.getDaysInMonth(set[zz])) {
													newDate.setDate(dojo.date.getDaysInMonth(set[zz]) - regexResult[2]);
												}
											} else {
												if (regexResult[2] < dojo.date.getDaysInMonth(set[zz])) {
													newDate.setDate(regexResult[2]);
												}
											}
											subset.push(newDate);
										}
										tmp = set.concat(subset);
										set = tmp;
									}
								}
							}
						} else {
							dojo.debug("TODO: byday within a yearly rule without a bymonth");
						}
					}

					dojo.debug("TODO: Process BYrules for units larger than frequency");

					//add this set of events to the complete recurranceSet
					var tmp = recurranceSet.concat(set);
					recurranceSet = tmp;
				}
			}

			// TODO: add rdates to the recurrance set here

			// TODO: subtract exdates from the recurrance set here

			//TODO:  subtract dates generated by exrules from recurranceSet here

			recurranceSet.push(dtstart);
			return recurranceSet;
		},

		getDate: function() {
			var dt = parseDate(this.dtstart.value);//dojo.date.stamp.fromISOString(this.dtstart.value);

			console.log("VEvent returning date ", dt, " from dtstart " , this.dtstart);

			return dt;
		}
});

/*
 * VTIMEZONE
 */

var VTimeZoneProperties = [
	_P("tzid", 1, true), _P("last-mod", 1), _P("tzurl", 1)

	// one of 'standardc' or 'daylightc' must occur
	// and each may occur more than once.
];

cal.iCalendar.VTimeZone = function (/* string */ body) {
	// summary
	// VTIMEZONE Component
	this.name = "VTIMEZONE";
	this._ValidProperties = VTimeZoneProperties;
	cal.iCalendar.Component.call(this, body);
}

inherits(cal.iCalendar.VTimeZone, cal.iCalendar.Component);

/*
 * VTODO
 */

var VTodoProperties = [
	// these can occur once only
	_P("class", 1), _P("completed", 1), _P("created", 1), _P("description", 1),
	_P("dtstart", 1), _P("geo", 1), _P("last-mod", 1), _P("location", 1),
	_P("organizer", 1), _P("percent", 1), _P("priority", 1), _P("dtstamp", 1),
	_P("seq", 1), _P("status", 1), _P("summary", 1), _P("uid", 1), _P("url", 1),
	_P("recurid", 1),
	// these two are exclusive
	[_P("due", 1), _P("duration", 1)],
	// these can occur many times over
	_P("attach"), _P("attendee"), _P("categories"), _P("comment"), _P("contact"),
	_P("exdate"), _P("exrule"), _P("rstatus"), _P("related"), _P("resources"),
	_P("rdate"), _P("rrule")
];

cal.iCalendar.VTodo= function (/* string */ body) {
	// summary
	// VTODO Componenet
	this.name = "VTODO";
	this._ValidProperties = VTodoProperties;
	cal.iCalendar.Component.call(this, body);
}

inherits(cal.iCalendar.VTodo, cal.iCalendar.Component);

/*
 * VJOURNAL
 */

var VJournalProperties = [
	// these can occur once only
	_P("class", 1), _P("created", 1), _P("description", 1), _P("dtstart", 1),
	_P("last-mod", 1), _P("organizer", 1), _P("dtstamp", 1), _P("seq", 1),
	_P("status", 1), _P("summary", 1), _P("uid", 1), _P("url", 1), _P("recurid", 1),
	// these can occur many times over
	_P("attach"), _P("attendee"), _P("categories"), _P("comment"), _P("contact"),
	_P("exdate"), _P("exrule"), _P("related"), _P("rstatus"), _P("rdate"), _P("rrule")
];

cal.iCalendar.VJournal= function (/* string */ body) {
	// summary
	// VJOURNAL Component
	this.name = "VJOURNAL";
	this._ValidProperties = VJournalProperties;
	cal.iCalendar.Component.call(this, body);
}

inherits(cal.iCalendar.VJournal, cal.iCalendar.Component);

/*
 * VFREEBUSY
 */

var VFreeBusyProperties = [
	// these can occur once only
	_P("contact"), _P("dtstart", 1), _P("dtend"), _P("duration"),
	_P("organizer", 1), _P("dtstamp", 1), _P("uid", 1), _P("url", 1),
	// these can occur many times over
	_P("attendee"), _P("comment"), _P("freebusy"), _P("rstatus")
];

cal.iCalendar.VFreeBusy= function (/* string */ body) {
	// summary
	// VFREEBUSY Component
	this.name = "VFREEBUSY";
	this._ValidProperties = VFreeBusyProperties;
	cal.iCalendar.Component.call(this, body);
}

inherits(cal.iCalendar.VFreeBusy, cal.iCalendar.Component);

/*
 * VALARM
 */

var VAlarmProperties = [
	[_P("action", 1, true), _P("trigger", 1, true), [_P("duration", 1), _P("repeat", 1)],
	_P("attach", 1)],

	[_P("action", 1, true), _P("description", 1, true), _P("trigger", 1, true),
	[_P("duration", 1), _P("repeat", 1)]],

	[_P("action", 1, true), _P("description", 1, true), _P("trigger", 1, true),
	_P("summary", 1, true), _P("attendee", "*", true),
	[_P("duration", 1), _P("repeat", 1)],
	_P("attach", 1)],

	[_P("action", 1, true), _P("attach", 1, true), _P("trigger", 1, true),
	[_P("duration", 1), _P("repeat", 1)],
	_P("description", 1)]
];

cal.iCalendar.VAlarm= function (/* string */ body) {
	// summary
	// VALARM Component
	this.name = "VALARM";
	this._ValidProperties = VAlarmProperties;
	cal.iCalendar.Component.call(this, body);
}

inherits(cal.iCalendar.VAlarm, cal.iCalendar.Component);


})();