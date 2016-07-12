(function($) {
	ItemListWidget = function (props) {
		$.extend(this, props);
		this.clearItems();
		return this;
	};

	ItemListWidget.prototype.populate = function (docs, expanded, callback) {
		$(this.target).empty();
		this.itemData = { 'docs': docs, 'expanded': expanded };
		this.length = docs.length;
		
		for (var i = 0, l = docs.length; i < l; i++)
			this.pushItem(docs[i], expanded[docs[i].s_uuid]);
	};
	
	ItemListWidget.prototype.addItem = function (doc, exp) {
		this.itemData.docs.push(doc);
		this.itemData.expanded[doc.s_uuid] = exp;
		this.length++;
		return this.pushItem(doc, exp);
	};
	
	ItemListWidget.prototype.clearItems = function () {
		$(this.target).empty();
		this.itemData = { 'docs': [], 'expanded': { } }
		this.length = 0;
	};

	ItemListWidget.prototype.findItem = function (doc_uuid) {
		return typeof doc_uuid === "string" ? 
			this.itemData.docs.find(function (doc) { return doc.s_uuid === doc_uuid; }) : 
			this.itemData.docs.indexOf(doc_uuid) >= 0;
	};
	
	ItemListWidget.prototype.pushItem = function (doc, exp) {
		var self = this,
				el = $(this.template_substance(doc));
				
		if (typeof this.onClick === "function")
			el.on("click", function (e) { self.onClick.call(this, e, doc, exp, self); });
			
		if (typeof this.onCreated === 'function')
			this.onCreated.call(el, doc, this);
				
		$(this.target).append(el);
		$("a.more", el[0]).on("click", function(e) {
			e.preventDefault();
			e.stopPropagation();
			var $this = $(this), 
					$div = $(".more-less", $this.parent()[0]);

			if ($div.is(':visible')) {
				$div.hide();
				$this.text('more');
			} else {
				$div.show();
				$this.text('less');
			}

			return false;
		});
		
		return el;
	};
	
	ItemListWidget.prototype.eraseItem = function (doc_uuid) {
		var uuid = typeof doc_uuid === "string" ? doc_uuid : doc_uuid.s_uuid;
		
		for (var i = 0, l = this.itemData.docs.length; i < l; ++i)
			if (this.itemData.docs[i].s_uuid === uuid)
				break;
				
		if (i >= l) return false;
		
		delete this.itemData.expanded[uuid];
		this.length--;
		return this.itemData.docs.splice(i, 1)[0];
	};
	
	ItemListWidget.prototype.enumerateItems = function (callback) {
		var els = $(this.target).children();
		for (var i = 0, l = this.itemData.docs.length; i < l; ++i)
			callback.call(els[i], this.itemData.docs[i]);
	};
	
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
					item_id: (this.prefix || this.id || "item") + "_" + doc.s_uuid,
					publicname: (doc.publicname[0] || "") + "  " + (doc.publicname[0] === doc.name[0] ? "" : "(" + doc.name[0] + ")")
				};
		

		var snippet = this.template_measurement(doc),
				expanded = this.itemData.expanded[doc.s_uuid],
				external = null;
				
		if (expanded != null) {
			snippet += '<a href="#" class="more">more</a>';
			snippet += '<div class="more-less" style="display:none;">';
			
			for (var i = 0, l = expanded.docs.length; i < l; i++)
				snippet += this.template_measurement(expanded.docs[i]);
				
			snippet += '</div>';
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
		
		return getFillTemplate("result-item", item);
	};
	
	ItemListWidget.prototype.template_measurement = function(doc) {
		var value = "",
				snippet = {
					'category': doc.topcategory + "." + (lookup[doc.endpointcategory] || doc.endpointcategory),
					'interpretation': doc.interpretation_result || "",
					'guidance': !!doc.guidance ? "[" + doc.guidance + "]" : "",
					'link': "",
					'href': "",
					'title': ""
				};
				
		if (!!doc.effectendpoint)	value += (lookup[doc.effectendpoint] || doc.effectendpoint[0]) + " = ";
		if (!!doc.loValue) value += " " + (doc.loValue[0] || "");
		if (!!doc.upValue) value += (!doc.loValue ? " " : "…") + (doc.upValue[0] || "");
		if (!!doc.unit) value += " <i>" + formatUnits(doc.unit[0] || "") + "</i>";
		if (!!doc.textValue) value += " " + formatUnits(doc.textValue || "");

		snippet.value = value;
		if (doc.reference != null) {
			snippet.link = (doc.reference_year == null) ? "DOI" : "[" + doc.reference_year + "]";
			snippet.href = doc.reference[0];
			snippet.title = doc.reference;
		}

		return fillString($("#study-item").html(), snippet);
	};
})(jQuery);
