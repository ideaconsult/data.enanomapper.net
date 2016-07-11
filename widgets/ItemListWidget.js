(function($) {
	ItemListWidget = function (props) {
		$.extend(this, props);
		this.clearItems();
		return this;
	};

	ItemListWidget.prototype.populate = function (docs, expanded) {
		$(this.target).empty();
		this.itemData = { 'docs': docs, 'expanded': expanded };
		this.length = docs.length;
		
		for (var i = 0, l = docs.length; i < l; i++)
			this.pushItem(docs[i], expanded[docs[i].s_uuid]);
	}
	
	ItemListWidget.prototype.addItem = function (doc, exp) {
		this.itemData.docs.push(doc);
		this.itemData.expanded[doc.s_uuid] = exp;
		this.length++;
		return this.pushItem(doc, exp);
	}
	
	ItemListWidget.prototype.clearItems = function () {
		$(this.target).empty();
		this.itemData = { 'docs': [], 'expanded': { } }
		this.length = 0;
	}

	ItemListWidget.prototype.findItem = function (doc_uuid) {
		return typeof doc_uuid === "string" ? 
			this.itemData.docs.find(function (doc) { return doc.s_uuid === doc_uuid; }) : 
			this.itemData.docs.indexOf(doc_uuid) >= 0;
	}
	
	ItemListWidget.prototype.pushItem = function (doc, exp) {
		var self = this,
				el = $(this.template_substance(doc)).on("click", function (e) { self.onClick.call(this, e, doc, exp); });
				
		$(this.target).append(el);
		return el;
	}
	
	ItemListWidget.prototype.eraseItem = function (doc_uuid) {
		var uuid = typeof doc_uuid === "string" ? doc_uuid : doc_uuid.s_uuid;
		
		for (var i = 0, l = this.itemData.docs.length; i < l; ++i)
			if (this.itemData.docs[i].s_uuid === uuid)
				break;
				
		if (i >= l) return false;
		
		delete this.itemData.expanded[uuid];
		this.length--;
		return this.itemData.docs.splice(i, 1)[0];
	}
	
	/**
	 * substance
	 */
	ItemListWidget.prototype.template_substance = function(doc) {
		if (doc.type_s != 'study') return;
		
		var snippet = "",
				root = "https://data.enanomapper.net/substance/",
				item = { 
					logo: "images/logo.png",
					link: "#",
					footer: "",
					publicname: (doc.publicname[0] || "") + "  " + (doc.publicname[0] === doc.name[0] ? "" : "(" + doc.name[0] + ")")
				};
		

		var snippet = this.template_measurement(doc),
				expanded = this.itemData.expanded[doc.s_uuid],
				external = null;
				
		if (expanded != null) {
			snippet += ' <a href="#" class="more">more</a>';
			snippet += '<span style="display:none;">';
			for (var i = 0, l = expanded.docs.length; i < l; i++) {
				snippet += "<br/>";
				snippet += this.template_measurement(expanded.docs[i]);
			}
			snippet += '</span>';
		}
		
		item.snippet = snippet;
		
		if (doc.content == null) {
			item.link = root + doc.s_uuid;
			item.href = item.link	+ "/study";
			item.href_title = "Study";
			item.href_target = doc.s_uuid;
		} 
		else {
			if (doc.owner_name[0].lastIndexOf("caNano", 0) === 0) {
				item.logo = "images/canano.jpg";
				item.href_title = "caNanoLab: " + item.link;
				item.href_target = external = "caNanoLab";
			}
			else {
				item.logo = "images/external.png";
				item.href_title = "External: " + item.link;
				item.href_target = "external";
				item.footer = 
					'<a href="' + item.root + doc.s_uuid + '" title="Substance" target="' + doc.s_uuid + '">material</a>' +
					'<a href="' + item.root + doc.s_uuid + '/structure" title="composition" target="' + doc.s_uuid + '">composition</a>' +
					'<a href="' + item.root + doc.s_uuid + '/study" title="Study" target="' + doc.s_uuid + '">study</a>';
			}

			if (doc.content != null && doc.content.length > 0) {
				item.link = doc.content[0];	

				for (var i = 0, l = doc.content.length; i < l; i++)
					item.footer += '<a href="' + doc.content[i] + '" target="external">' + (external == null ? "External database" : external) + '</a>';	
			}
				
			item.href = item.link || "#";
		}	
		
		item.footer_link = "links_" + doc.s_uuid;
		
		return getFillTemplate("result-item", item);
	};
	
	ItemListWidget.prototype.template_measurement = function(doc) {
		var snippet = "";
		try {
			var value = doc.topcategory + ".";
			var view = lookup[doc.endpointcategory];
			value += (view==undefined?doc.endpointcategory:view) + " ";
			try {
				if (doc.interpretation_result != undefined)
					value += doc.interpretation_result + " ";
			} catch (err) {
			}

			try {
				if (doc.effectendpoint != undefined) {
					var view_effectendpoint = lookup[doc.effectendpoint];
					value += (view_effectendpoint == undefined ? doc.effectendpoint[0]
							: view_effectendpoint);
				}
			} catch (err) {
			}

			value += " = ";
			try {
				value += doc.loValue[0];
			} catch (err) {
			}
			try {
				value += " ";
				value += doc.upValue[0];
			} catch (err) {
			}

			try {
				value += " " + doc.unit[0];
			} catch (err) {
			}

			try {
				if (textValue != undefined)
					value += " " + doc.textValue;
			} catch (err) {
			}

			snippet += value;
			if (doc.guidance != null)
				snippet += " [" + doc.guidance + "]";

			if (doc.reference != null) {
				var link = (doc.reference_year===undefined)?"DOI":("["+doc.reference_year+"]");
				snippet += " <a href='" + doc.reference[0]
						+ "' title='" + doc.reference
						+ "' target='ref'>"+link+"</a>";
			}
			/*
			 * snippet += value + "<br/>" +
			 * (doc.reference_owner===undefined)?"":doc.reference_owner + ' ' +
			 * (doc.reference===null?"":doc.reference) + "<br/>";
			 * snippet += "<b>"+ doc.topcategory + "." +
			 * doc.endpointcategory + "</b><br/>Protocol: <i>" +
			 * doc.guidance+ "</i>";
			 */
		} catch (err) {
			console.log(err);
		}
		return snippet;
	};
	
	ItemListWidget.initItemList = function() {
		$(document).on(
				'click',
				'a.more',
				function() {
					var $this = $(this), span = $this.parent()
							.find('span');

					if (span.is(':visible')) {
						span.hide();
						$this.text('more');
					} else {
						span.show();
						$this.text('less');
					}

					return false;
				});
	};
	
})(jQuery);
