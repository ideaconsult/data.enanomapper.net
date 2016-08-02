(function ($) {

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,
  skipClear: false,

  afterRequest: function () {
    var self = this, el, f, fk, fv,
        links = [],
        q = this.manager.store.get('q').val(),
        fq = this.manager.store.get('fq');
        
    if (self.skipClear) {
      self.skipClear = false;
      return;
    }
    
    $("#sliders").empty();
    
    // add the free text search as a tag
    if (q != '*:*') {
        links.push(self.renderTag(q, "x", function () {
          self.manager.store.get('q').val('*:*');
          self.doRequest();
          return false;
        }));
    }

    // now add the facets
    for (var i = 0, l = fq.length; i < l; i++) {
	    f = fq[i];
	    fk = f.val().match(self.manager.facetFieldRegExp);
    	if (!!fk) {
        fk = fk[2];
        fv = self.manager.tweakParamValues(f);
        
        for (var j = 0, fvl = fv.length, pv; j < fvl; ++j) {
          pv = (fk == PivotWidget.endpointField);
      		links.push(el = self.tagRenderer(fv[j], pv ? "i" : "x", fvl > 1 ? self.reduceFacet(i, fv[j]) : self.removeFacet(i)).addClass('tag_selected'));

      		if (fvl > 1)
      		  el.addClass("combined");
      		  
      		if (pv)
      		  $("span", el[0]).on("click", self.rangeToggle(i, fk, fv[j]));
      		  
      		el.addClass(self.colorMap[fk]);
        }
        
        if (fvl > 1)
  		    el.addClass("last");
      }
    }
    
    if (links.length) {
      links.push(self.renderTag("Clear", "", function () {
        self.manager.store.get('q').val('*:*');
        self.manager.store.removeByValue('fq', self.manager.facetFieldRegExp);
        self.doRequest();
        return false;
      }).addClass('tag_selected tag_clear'));
      
      this.target.empty().addClass('tags').append(links);
    }
    else
      this.target.removeClass('tags').html('<li>No filters selected!</li>');
  },

  rangeToggle: function (index, field, value) {
    var self = this;
    return function () {
      var pivots = PivotWidget.locatePivot(field, value),
          sliders = $("#sliders"), width, el;
          filter = {},
          updateFilter = function(field, value) { 
            return function (values) {
              var ff = filter[field];
              if (!ff)
                ff = ff[field] = { };
              ff[value] = values.split(",");
            } 
          };

      $("li", self.target[0]).removeClass("active");
      $(this).closest("li").addClass("active");

      el = jT.getFillTemplate("#slider-update").appendTo(sliders.empty()).on("click", function (e) {
        PivotWidget.addRangeFilter(filter);
        self.skipClear = true;
        self.doRequest();
      });
      
      width = sliders.width() - el.width() - 20;
      
      for (var i = 0, lp = pivots.length, pe, args;i < lp; ++i) {
        pe = pivots[i];
        
        var range = pe.stats.stats_fields.loValue, 
            prec = Math.pow(10, parseInt(Math.min(1, Math.floor(Math.log10(range.max - range.min + 1) - 3)))),
            scale;

        // jRange will treat 0.1 range, as 0.01, so we better set it this way
        if (prec < 1 && prec > .01) prec = .01;
          
        range.min = range.min != null ? getRoundedNumber(range.min, prec) : "-";
        range.max = range.max != null ? getRoundedNumber(range.max, prec) : "-";

        for(var pp = pe ; pp.field != PivotWidget.categoryField ; pp = pp.parent);
        scale = [range.min, getTitleFromFacet(pp.value), range.max];
          
        sliders.append(el = jT.getFillTemplate("#slider-one", range));
          
        el.jRange({
        	from: range.min,
        	to: range.max,
        	step: prec,
        	scale: scale,
        	showScale: true,
        	showLabels: range.min < range.max,
        	disable: range.min >= range.max,
        	isRange: true,
        	width: width / (Math.min(lp, 2) + 0.1),
        	format: "%s " + (pe.field == "unit" ? jT.ui.formatUnits(pe.value) : ""),
        	ondragend: updateFilter(pe.field, pe.value)
      	});
      }
      
      return false;
    };
  },

  removeFacet: function (index) {
    var self = this;
    return function () {
      self.manager.store.remove('fq', index);
      self.doRequest();
      return false;
    };
  },
  
  reduceFacet: function (index, value) {
    var self = this;
    return function () {
      var par = self.manager.store.get('fq')[index],
          res = self.manager.tweakParamValues(par, value, true);

      if (!!res)
        self.doRequest();
        
      return false;
    };
  }
  
});

})(jQuery);
