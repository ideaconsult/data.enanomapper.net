(function ($) {

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,
  skipClear: false,
  rangeParameters: [],

  init: function () {
    AjaxSolr.CurrentSearchWidget.__super__.init.call(this);
    var self = this;
        self.slidersBlock = $("#sliders");
        
    self.applyCommand = $("#sliders-controls a.command.apply").on("click", function (e) {
      self.skipClear = true;
      self.doRequest();
      return false;
    });
    
    $("#sliders-controls a.command.close").on("click", function (e) {
      self.rangeRemove();
      return false;
    });
  },
  
  afterRequest: function () {
    var self = this, el, f, fk, fv,
        links = [],
        q = this.manager.store.get('q').val(),
        fq = this.manager.store.get('fq');
        
    if (self.skipClear) {
      self.skipClear = false;
      return;
    }
    
    self.rangeRemove();
    self.rangeParameters = [];
    
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
	    
	    // First try it as range parameter
	    fv = self.manager.getRangeFromParam(f, i);
	    if (!!fv) {
  	    self.rangeParameters.push(fv);
  	    continue;
	    }
	    
	    // then try it as normal set filter
	    fv = self.manager.tweakParamValues(f);
	    if (!!fv) {
        fk = fv.field;
        
        for (var j = 0, fvl = fv.length, pv; j < fvl; ++j) {
          pv = (fk == PivotWidget.endpointField);
      		links.push(el = self.renderTag(fv[j], "i", self.removeFacet(i, fk, fv[j])).addClass("tag_selected " + (pv ? "tag_open" : "tag_fixed")));

      		if (fvl > 1)
      		  el.addClass("tag_combined");
      		  
      		if (pv)
      		  $("span", el[0]).on("click", self.rangePresent(i, fk, fv[j]));
      		  
      		el.addClass(self.colorMap[fk]);
        }
        
        if (fvl > 1)
  		    el.addClass("tag_last");
      }
    }
    
    if (links.length) {
      links.push(self.renderTag("Clear", "", function () {
        self.manager.store.get('q').val('*:*');
        self.manager.store.removeByValue('fq', self.manager.facetFieldRegExp);
        self.manager.store.removeByValue('fq', self.manager.rangeFieldRegExp);
        self.doRequest();
        return false;
      }).addClass('tag_selected tag_clear tag_fixed'));
      
      this.target.empty().addClass('tags').append(links);
    }
    else
      this.target.removeClass('tags').html('<li>No filters selected!</li>');
  },

  rangeRemove: function() {
    this.slidersBlock.empty();
    this.slidersBlock.parent().removeClass("active");
    $("li", this.target[0]).removeClass("active");
  },
  
  rangePresent: function (index, field, value) {
    var self = this;
    return function () {
      var pivots = PivotWidget.locatePivots(field, value, PivotWidget.unitField),
          // build a counter map of found pivots.
          pivotMap = (function() {
            var map = {};
            for (var i = 0, pl = pivots.length; i < pl; ++i) {
              var pe = pivots[i];
              for (var pp = pe; !!pp; pp = pp.parent) {
                var info = map[pp.field];
                if (!info)
                  map[pp.field] = info = {};
                  
                if (!info[pp.value])
                  info[pp.value] = 1;
                else
                  info[pp.value]++;
              }
            }
            
            return map;
          })(),
          updateRange = function(range) {  return function (values) { 
            self.manager.tweakAddRangeParam(range, values.split(","));
            self.applyCommand.css("opacity", 1.0);
            setTimeout(function () { self.applyCommand.css("opacity", ""); }, 500);
          } },
          matchRange = function (pivot) {
            var ctx = { };
            for (var pp = pivot; !!pp; pp = pp.parent) {
              if (PivotWidget.contextFields.indexOf(pp.field) > -1 || pivotMap[pp.field][pp.value] < pivots.length)
                ctx[pp.field] = pp.value;
            }

            var par = self.rangeParameters.find( function (e) { 
              for (var k in ctx)
                if (e.context[k] !== undefined && ctx[k] !== e.context[k])
                  return false;
              return true;
            });
            
            return $.extend(par, { 'context': ctx }, pivot.stats.stats_fields.loValue);
          };

      if ($(this).closest("li").hasClass("active")) {
        self.rangeRemove();
        return false;
      }
      
      $("li", self.target[0]).removeClass("active");
      $(this).closest("li").addClass("active");
      self.slidersBlock.empty().parent().addClass("active");
      
      for (var i = 0, lp = pivots.length;i < lp; ++i) {
        var pe = pivots[i],
            range = matchRange(pe),
            prec = Math.pow(10, parseInt(Math.min(1, Math.floor(Math.log10(range.max - range.min + 1) - 3)))),
            names = [],
            enabled = (range.min < range.max),
            units = (pe.field == PivotWidget.unitField ? jT.ui.formatUnits(pe.value) : "");

        // jRange will treat 0.1 range, as 0.01, so we better set it this way
        if (prec < 1 && prec > .01) 
          prec = .01;
        
        range.min = range.min != null ? getRoundedNumber(range.min, prec) : "-";
        range.max = range.max != null ? getRoundedNumber(range.max, prec) : "-";

        if (range.value == null)
          range.value = [ range.min, range.max ];

        // Build the name on the range scale, based on the field:value pairs
        // that are needed for filtering, i.e. - those that differ...
        for(var pp in range.context) {
          var pv = range.context[pp];
          if (pp != PivotWidget.unitField && pivotMap[pp][pv] < pivots.length)
            names.push(getTitleFromFacet(pv));
        }
        
        // ... still have the given filter as fallback for empty scale.
        if (!names.length)
          names.push(getTitleFromFacet(value));
        else
          names.reverse();
          
        // We're ready to prepare the slider and add it to the DOM.
        self.slidersBlock.append(el = jT.getFillTemplate("#slider-one", range));
          
        el.jRange({
        	from: range.min,
        	to: range.max,
        	step: prec,
        	scale: [range.min, names.join("/") + (enabled ? "" : " (" + units + ")"), range.max],
        	showScale: true,
        	showLabels: enabled,
        	disable: !enabled,
        	isRange: true,
        	theme: "theme-" + self.colorMap[field],
        	width: parseInt(self.slidersBlock.width() - $("#sliders-controls").width() - 20) / (Math.min(lp, 2) + 0.1),
        	format: "%s " + units,
        	ondragend: updateRange(range)
      	});
      }
      
      return false;
    };
  },

  removeFacet: function (index, field, value) {
    var self = this;
    return function () {
      var par = self.manager.store.get('fq')[index],
          res = self.manager.tweakParamValues(par, value, true);

      if (!!res) {
        if (!!par.value.match(new RegExp(field + ":" + "\\(\\s*\\)")))
          self.manager.store.remove('fq', index);
          
        self.manager.filterRangeParameters(function (par) {
          return par.val().indexOf(field + ":" + AjaxSolr.Parameter.escapeValue(value)) < 0; // i.e. leave it IN, when this is not found
        });
          
        self.doRequest();
      }
        
      return false;
    };
  }
  
});

})(jQuery);
