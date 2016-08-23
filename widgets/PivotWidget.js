(function($) {
	var buildValueRange = function (facet, suffix) {
				var stats = facet.stats.stats_fields;
				return 	" = " + (stats.loValue.min == null ? "-&#x221E;" :  stats.loValue.min) +
								"&#x2026;" + (stats.loValue.max == null ? "&#x221E;" : stats.loValue.max) +
								" " + (suffix == null ? jT.ui.formatUnits(facet.value) : suffix);
			};
	
	AjaxSolr.PivotWidget = AjaxSolr.BaseFacetWidget.extend({
    init: function () {
      AjaxSolr.PivotWidget.__super__.init.call(this);
      var loc = { stats: this.id + "_stats" };
      if (this.multivalue)
        loc.ex = this.id;

      this.manager.store.addByValue('facet.pivot', this.pivotFields.join(","), loc);
      this.manager.store.addByValue('stats.field', this.statField, { tag: this.id + "_stats", min: true, max: true, ex: this.id + "_range" });
      
      this.topField = this.pivotFields[0];
    },
    
		buildFacetDom: function (facet, renderer) {
      var elements = [], root;
			
			if (facet.pivot == null || !facet.pivot.length) // no separate pivots - nothing to declare
				;
			else {
				for (var i = 0, fl = facet.pivot.length, f;i < fl; ++i) {
					f = facet.pivot[i];
					f.parent = facet;
					elements.push(f.field == this.endpointField ? renderer(f).addClass(this.colorMap[f.field]) : this.buildFacetDom(f, renderer)[0]);
					if (f.field == this.endpointField && f.pivot)
					  f.pivot.forEach(function (o) { o.parent = f; });
				}
	
				if (elements.length > 0 && facet.field != this.topField) {
					root = jT.getFillTemplate($("#tag-facet"), facet);
					
					// we need to add outselves as main tag
					if (facet.field != this.endpointField)
				    root.append(renderer(facet).addClass("category title").addClass(this.colorMap[facet.field]));
					
					root.append(elements);
					elements = [root];
				}
			}
			
			return elements;
		},
    
    afterChangeSelection: function () {
      this.doRequest()
    },
    
		afterRequest : function() {
			var self = this,
					root = this.manager.response.facet_counts.facet_pivot[self.pivotFields],
					refresh = this.target.data("refreshPanel");
					
			if (root === undefined) {
				this.target.html('No items found in current selection');
				return;
			}

      // some cleanup...
      $(".dynamic-tab", self.target.parent()[0]).each(function () {
  			var hdr = getHeaderText($(this).closest(".widget-root").prev());
  			
        hdr.textContent = jT.ui.updateCounter(hdr.textContent, 0);
        $("ul", this).remove();
      });
      
			for (var i = 0, fl = root.length; i < fl; ++i) {
				var facet = root[i], 
				    fid = facet.value.replace(/\s/, "_"), 
				    target;
				
				// we need to check if we have that accordion element created.
				if (facet.field == this.topField) {
  				target = $("#" + fid);
  				
  				if (target.length > 0) {
    				var hdr = getHeaderText(target.closest(".widget-root").prev());
            hdr.textContent = jT.ui.updateCounter(hdr.textContent, facet.count);
    		  }
  				else {
    				facet.id = fid;
    				self.target.before(target = jT.getFillTemplate($("#tab-topcategory"), facet));
    				target = $(target.last()).addClass("dynamic-tab");
    				self.tabsRefresher();
  				}
				}
				
				target.append(self.buildFacetDom(facet, function (f) {
					var msg = "";
					
					if (f.pivot == undefined) 
						msg = buildValueRange(f, "");
					else for ( var j = 0, ul = f.pivot.length; j < ul; ++j ) { 
						if (j > 0)
							msg += ", ";
							
						msg += buildValueRange(f.pivot[j]);
					}
					
					return self.renderTag( f.value, f.count, msg, self.clickHandler(f.value, f.field));
				}));
			}
			
			if (!!refresh)
				refresh.call();
		},
		
		locatePivots: function (field, value, deep) {
  	  var pivots = [],
  	      searchLevel = function (list, found) {
    	      if (!list || !list.length) return;
    	      for (var i = 0, ll = list.length, e; i < ll; ++i) {
      	      e = list[i];
      	        
      	      if (e.field === field) {
        	      if (!(found = (e.value === value)))
                  continue;
              }
      	        
              if (found && (e.field === deep || !e.pivot))
                pivots.push(e);
              else if (!!e.pivot)
    	          searchLevel(e.pivot, found);
    	      }
  	      };
      
      searchLevel(this.manager.response.facet_counts.facet_pivot[this.pivotFields]);
      return pivots;
		}		
	});
})(jQuery);
