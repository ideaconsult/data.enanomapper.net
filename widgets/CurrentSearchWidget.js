(function (Solr, a$, $, jT) {

jT.CurrentSearchWidgeting = function (settings) {
  a$.extend(this, settings);
  this.manager = null;
  this.skipClear = false;
  this.facetWidgets = null;
  this.rangeParameters = [];
  this.rangeFieldRegExp = /loValue:\[\s*([\d\.\-]+)\s+TO\s+([\d\.\-]+)\s*\]/;
};

jT.CurrentSearchWidgeting.prototype = {

  getRangeFromParam: function (par) {
    var pval = par.value,
        m = pval.match(this.rangeFieldRegExp),
        range = null;

    if (!m)
      return null;
      
    var range = { '__parameter': par, 'value': [ parseFloat(m[1]), parseFloat(m[2]) ], 'context': {} },
        sarr = pval.replace(m[0], "").replace(/\s+AND\s*\)\s*$/, "").replace(/^\s*-?\(?/, "").replace(/\)\s*$/, "").split(/\s+AND\s+/);
        
    for (var i = 0;i < sarr.length; ++i) {
      var mm = sarr[i].match(/(\w+):(.+)/);
      if (!mm)
        continue;
        
      range.context[mm[1]] = mm[2].replace(/^"/, "").replace(/"$/, "");
    }

    return range;
  },
  
  tweakAddRangeParam: function (range, values, tag) {
    if (!range.__parameter)
      range.__parameter = this.manager.addParameter({ 'name': "fq", 'value': "____", 'domain': tag != null ? { 'tag': tag } : undefined } );
      
    if (values != null)
      range.value = values;
      
    var vals = [],
        rngVal = "loValue:[" + range.value.join(" TO ") + "]";
        
    for (var f in range.context)
      vals.push(f + ":" + Solr.escapeValue(range.context[f]));
      
    if (vals.length > 0) {
      vals.push("-" + rngVal);  
      range.__parameter.value = "-(" + vals.join(" AND ") + ")";
    }
    else
      range.__parameter.value = rngVal;
  },
  
  filterRangeParameters: function (filter) {
    var pars = this.manager.getParameter('fq');
    for (var i = 0; i < pars.length; ++i) {
      var p = pars[i];

      if (!p.value.match(this.rangeFieldRegExp))
        continue;
        
      if (filter(p))
        continue;
      
      this.manager.removeParameters('fq', i--);
    }
  },

  init: function (manager) {
    var self = this;
        self.slidersBlock = $("#sliders");
        
    self.manager = manager;
        
    self.applyCommand = $("#sliders-controls a.command.apply").on("click", function (e) {
      self.skipClear = true;
      self.manager.doRequest();
      return false;
    });
    
    $("#sliders-controls a.command.close").on("click", function (e) {
      self.rangeRemove();
      return false;
    });
  },
  
  afterRequest: function () {
    var self = this, el, f, fk, fv, pv,
        links = [],
        q = this.manager.getParameter('q');
        fq = this.manager.getParameter('fq');
        
    if (self.skipClear) {
      self.skipClear = false;
      return;
    }
    
    // We do that know to be _sure_ that all widgets are already added.
    if (self.facetWidgets == null) {
      self.facetWidgets = {};
      self.manager.enumerateListeners(function (l) {
        if (l.field != null)
          self.facetWidgets[l.field] = l;
      });
    }
    
    self.rangeRemove();
    self.rangeParameters = [];
    
    // add the free text search as a tag
    if (q.value != '*:*') {
        links.push(self.renderTag(q.value, "x", function () {
          q.value = "*:*";
          self.manager.doRequest();
          return false;
        }));
    }

    // now scan all the parameters for facets and ranges.
    for (var i = 0, l = fq.length; i < l; i++) {
	    f = fq[i];
	    
	    // First try it as a range parameter
	    fv = self.getRangeFromParam(f);
	    if (!!fv) {
  	    self.rangeParameters.push(fv);
  	    continue;
	    }
	    
	    // then try it as a normal set facet filter
	    fv = Solr.parseFacet(f.value);
	    if (!!fv) {
        fk = fv.field;
        if (self.facetWidgets[fk] == null)
          continue;
          
        pv = (fk == PivotWidget.endpointField);
        fk = self.facetWidgets[fk]; 
        fv = fv.value;
        if (!Array.isArray(fv))
          fv = [ fv ];

        for (var j = 0, fvl = fv.length; j < fvl; ++j) {
      		links.push(el = self.renderTag(fv[j], "i", self.unclickHandler(fv[j], fk)).addClass("tag_selected " + (pv ? "tag_open" : "tag_fixed")));

      		if (fvl > 1)
      		  el.addClass("tag_combined");
      		  
      		if (pv)
      		  $("span", el[0]).on("click", self.rangePresent(i, fk.field, fv[j]));
      		  
      		if (fk.color)
      		  el.addClass(fk.color);
        }
        
        if (fvl > 1)
  		    el.addClass("tag_last");
      }
    }
    
    if (links.length) {
      links.push(self.renderTag("Clear", "", function () {
        q.value = '*:*';
        a$.each(self.facetWidgets, function (w) { w.clearValues(); })
        self.manager.removeParameters('fq', self.rangeFieldRegExp);
        self.manager.doRequest();
        return false;
      }).addClass('tag_selected tag_clear tag_fixed'));
      
      this.target.empty().addClass('tags').append(links);
    }
    else
      this.target.removeClass('tags').html('<li>No filters selected!</li>');
  },
  
  unclickHandler: function(value, widget) {
    var self = this;
        
    return function () {
      widget.removeValue(value);

      self.filterRangeParameters(function (p) { return p.value.indexOf(widget.field + ":" + Solr.escapeValue(value)) == -1; });
      
      widget.doRequest();
      return false;
    };
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
          updateRange = function(range, prec) {  return function (values) {
            values = values.split(",").map(function (v) { return parseFloat(v); });
            
            // Fix the rouding error, because an entire entry can fall out...
            if (Math.abs(range.overall.max - values[1]) <= prec)
              values[1] = range.overall.max;
            if (Math.abs(range.overall.min - values[0]) <= prec)
              values[0] = range.overall.min;
              
            // Now, make the actual Solr parameter setting.
            self.tweakAddRangeParam(range, values);

            // add it to our range list, if it is not there already
            if (self.rangeParameters.indexOf(range) == -1)
              self.rangeParameters.push(range);

            self.applyCommand.css("opacity", 1.0);
            setTimeout(function () { self.applyCommand.css("opacity", ""); }, 500);
          } },
          matchRange = function (pivot) {
            var ctx = { },
                path = [];
                
            // build context AND path for the overallStatistics
            for (var pp = pivot; !!pp; pp = pp.parent) {
              path.push(pp.value.replace(/\s/, "_"));
              if (PivotWidget.contextFields.indexOf(pp.field) > -1 || pivotMap[pp.field][pp.value] < pivots.length)
                ctx[pp.field] = pp.value;
            }

            var rng = self.rangeParameters.find( function (e) { 
              return a$.similar(e.context, ctx);
            });
            
            path.reverse();
            
            return a$.extend(rng, { 'context': ctx }, pivot.stats.stats_fields.loValue, { overall: a$.path(PivotWidget.overallStatistics, path).loValue });
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
            prec = Math.pow(10, parseInt(Math.min(1, Math.floor(Math.log10(range.overall.max - range.overall.min + 1) - 3)))),
            names = [],
            enabled = (range.overall.min < range.overall.max),
            units = (pe.field == PivotWidget.unitField ? jT.ui.formatUnits(pe.value) : ""),
            scale;

        // jRange will treat 0.1 range, as 0.01, so we better set it this way
        if (prec < 1 && prec > .01) 
          prec = .01;

        if (range.value == null)
          range.value = [ range.min, range.max ];
        else {
          range.value[0] = Math.max(range.value[0], range.min);
          range.value[1] = Math.min(range.value[1], range.max);
        }

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
          
        scale = [
          getRoundedNumber(range.overall.min, prec), 
          names.join("/") + (enabled || !units ? "" : " (" + units + ")"), 
          getRoundedNumber(range.overall.max, prec)
          ];
          
        el.jRange({
        	from: scale[0],
        	to: scale[2],
        	step: prec,
        	scale: scale,
        	showScale: true,
        	showLabels: enabled,
        	disable: !enabled,
        	isRange: true,
        	theme: "theme-" + self.facetWidgets[field].color,
        	width: parseInt(self.slidersBlock.width() - $("#sliders-controls").width() - 20) / (Math.min(lp, 2) + 0.1),
        	format: "%s " + units,
        	ondragend: updateRange(range, prec)
      	});
      }
      
      return false;
    };
  }

};

jT.CurrentSearchWidget = a$(jT.CurrentSearchWidgeting);

})(Solr, asSys, jQuery, jToxKit);
