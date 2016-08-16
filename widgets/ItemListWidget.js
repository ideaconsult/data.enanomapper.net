(function($) {
	ItemListWidget = function (props) {
		$.extend(true, this, props);
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
				el = $(this.renderSubstance(doc));
				
		if (typeof this.onClick === "function")
			$("a.command", el[0]).on("click", function (e) { self.onClick.call(el[0], e, doc, exp, self); });
			
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
	ItemListWidget.prototype.renderSubstance = function(doc) {
		if (doc.type_s != 'study') return;
		
		var expanded = this.itemData.expanded[doc.s_uuid],
				external = null,
				sniphtml = $("#study-item").html(),
				snippets = [this.renderMeasurement(doc)],
				item = { 
					logo: "images/logo.png",
					link: "#",
					title: this.renderHeader(doc),
					composition: this.renderComposition(doc),
					snippet: "",
					item_id: (this.prefix || this.id || "item") + "_" + doc.s_uuid,
					footer: 
						'<a href="' + this.settings.root + doc.s_uuid + '" title="Substance" target="' + doc.s_uuid + '">Material</a>' +
						'<a href="' + this.settings.root + doc.s_uuid + '/structure" title="Composition" target="' + doc.s_uuid + '">Composition</a>' +
						'<a href="' + this.settings.root + doc.s_uuid + '/study" title="Study" target="' + doc.s_uuid + '">Study</a>'
				};
		
		if (expanded != null) {
			for (var i = 0, l = expanded.docs.length; i < l; i++)
				snippets.push(this.renderMeasurement(expanded.docs[i]));
				
			snippets.sort(function (a, b) {
				return a.category < b.category ? -1 : (a.category > b.category ? 1 : (a.value < b.value ? -1 : (a.value > b.value ? 1 : 0)));
			});
		}

		item.snippet = ccLib.formatString(sniphtml, snippets[0]);
		if (snippets.length > 1) {
			snippets.splice(0, 1);
			item.snippet += 
				'<a href="#" class="more">more</a>' +
				'<div class="more-less" style="display:none;">' + 
				snippets.map(function (s) { return ccLib.formatString(sniphtml, s)}).join("") +
				'</div>';
		}
			
		
		if (doc.content == null) {
			item.link = this.settings.root + doc.s_uuid;
			item.href = item.link	+ "/study";
			item.href_title = "Study";
			item.href_target = doc.s_uuid;
		} 
		else {
			item.href = item.link || "#";
			
			if (!!doc.owner_name && doc.owner_name[0].lastIndexOf("caNano", 0) === 0) {
				item.logo = "images/canano.jpg";
				item.href_title = "caNanoLab: " + item.link;
				item.href_target = external = "caNanoLab";
				item.footer = '';
			}
			else {
				item.logo = "images/external.png";
				item.href_title = "External: " + item.link;
				item.href_target = "external";
			}
			
			if (doc.content.length > 0) {
				item.link = doc.content[0];	

				for (var i = 0, l = doc.content.length; i < l; i++)
					item.footer += '<a href="' + doc.content[i] + '" target="external">' + (external == null ? "External database" : external) + '</a>';	
			}
		}	
		
		return jT.getFillTemplate("#result-item", item);
	};
	
	ItemListWidget.prototype.renderHeader = function(doc) {
  	var prop = doc[this.settings.summaryProperty],
  	    substancetype = doc.substanceType != null ? doc.substanceType[0] : null,
  	    pubname = (doc.publicname || doc.name || [""])[0];
  	
  	if ($.isArray(prop))
  	  prop = prop[0];
  	  
  	substancetype = lookup[substancetype] || substancetype;
    
    return  pubname + (pubname === doc.name[0] ? "" : "  (" + doc.name[0] + ")") + 
            (substancetype == null ? "" : (" " + substancetype + " " + (prop == null ? "" : "[" + prop + "] ")));
	};
	
	ItemListWidget.prototype.renderComposition = function (doc) {
		var snippets = [],
		    idgroups = ["CASRN", "EINECS", "ChemicalName", "TradeName"],
		    components = ["CORE", "COATING", "CONSTITUENT", "ADDITIVE", "IMPURITY", "FUNCTIONALISATION", "DOPING"];
		    
		$.each(components, function( index1, component ) {

			var ncomponent = doc["COMPOSITION." + component],
			    idprefix = component + " (" + (ncomponent == undefined ? "" : ncomponent) + "): ",
			    snippet = "";
			     
			$.each(idgroups, function( index2, group ) {
					var chemid = group + "." + component,
					    ids = doc[chemid];

					if (ids !== undefined) {
					  snippet += group + ":";
            $.each(ids, function (index3, id) {
              if (index3 > 0)
                snippet += " ";
              snippet += '<a href="#" class="freetext_selector">' + id + '</a>';
            });
					  
						snippet += " ";
					}	
			});
			
			if (snippet.length > 0)
  			snippets.push(idprefix + snippet);
		});
		
	  return snippets.join("<br/>");
	};
	
	ItemListWidget.prototype.renderMeasurement = function(doc) {
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
		if (!!doc.unit) value += '<span class="units">' + jT.ui.formatUnits(doc.unit[0] || "") + '</span>';
		if (!!doc.textValue) value += " " + doc.textValue || "";

		snippet.value = value;
		if (doc.reference != null) {
			snippet.link = (doc.reference_year == null) ? "DOI" : "[" + doc.reference_year + "]";
			snippet.href = doc.reference[0];
			snippet.title = doc.reference;
		}

		return snippet;
	};
})(jQuery);
