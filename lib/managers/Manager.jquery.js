(function (callback) {
  if (typeof define === 'function' && define.amd) {
    define(['core/AbstractManager'], callback);
  }
  else {
    callback();
  }
}(function () {

/**
 * @see http://wiki.apache.org/solr/SolJSON#JSON_specific_parameters
 * @class Manager
 * @augments AjaxSolr.AbstractManager
 */
AjaxSolr.Manager = AjaxSolr.AbstractManager.extend(
  /** @lends AjaxSolr.Manager.prototype */
  {
  facetFieldRegExp: /^(\{[^\}]+\})?\-?([\w\.]+):/,
  rangeFieldRegExp: /\s*loValue:\[\s*([\d\.\-]+)\s+TO\s+([\d\.\-]+)\s*\]/,
  
  executeRequest: function (servlet, string, handler, errorHandler) {
    var self = this,
        options = { dataType: 'json' };

    string = string || this.store.string();
    handler = handler || function (data) {
      self.handleResponse(data);
    };
    
    errorHandler = errorHandler || function (jqXHR, textStatus, errorThrown) {
      self.handleError(textStatus + ', ' + errorThrown);
    };
    
    if (this.proxyUrl) {
      options.url = this.proxyUrl;
      options.data = {query: string};
      options.type = 'POST';
    }
    else {
      options.url = this.solrUrl + servlet + '?' + string + '&wt=json&json.wrf=?';
    }
    //console.log(options.url);
    jQuery.ajax(options).done(handler).fail(errorHandler);
  },
  
  getFacetParam: function (reg) {
    var index = this.store.find('fq', reg);
    if (AjaxSolr.isArray(index))
      index = index[0];
      
    return !index ? null : this.store.get('fq')[index];
  },
  
  tweakParamValues: function (par, val, remove) {
    if (par == null)
      return [];
    else if (typeof par === 'string')
      val = undefined; // i.e. we were given a string, so we cannot change the parameter's value.
      
    var str = (typeof par.val === 'function' ? par.val() : par)
        parts = str.match(this.facetFieldRegExp),
        sarr = str.replace(this.facetFieldRegExp, "").replace(/^\s*\(?/, "").replace(/\)\s*$/, "").replace(/\\"/g, "%0022").match(/[^\s"]+|"[^"]+"/g);
    
    if (!parts) return null;
    
    sarr.field = parts[2];
    for (var i = 0, sl = sarr.length; i < sl; ++i)
      sarr[i] = sarr[i].replace(/^"/, "").replace(/"$/, "").replace("%0022", '"');
  
    if (val !== undefined) {
      var ii = sarr.indexOf(val);
      
      if (remove === true && ii > -1)
        sarr.splice(ii, 1);
      else if (!remove && ii < 0)
        sarr.push(val);
      else
        return [];

      par.val(parts[0] + "(" + sarr.map(function(e) { return AjaxSolr.Parameter.escapeValue(e); }).join(" ") + ")");
    }
    return sarr;    
  },
  
  getRangeFromParam: function (par) {
    var pval = par.val(),
        m = pval.match(this.rangeFieldRegExp),
        range = null;

    if (!m)
      return null;
      
    console.log("Found Range Parameter: " + pval);
    var range = { '__parameter': par, 'range': [parseFloat(m[1]), parseFloat(m[2])], 'filter': {} },
        sarr = pval.replace(m[0], "").replace(/\s+AND\s*\)\s*$/, "").replace(/^\s*\(?/, "").replace(/\)\s*$/, "").split(/\s+AND\s+/);
        
    for (var i = 0;i < sarr.length; ++i) {
      var mm = sarr[i].match(/(\w+):(\w+)/);
      if (!mm)
        continue;
        
      range.filter[mm[1]] = mm[2].replace(/^"/, "").replace(/"$/, "");
    }

    return range;
  },
  
  tweakAddRangeParam: function (range) {
    console.log("Update: " + JSON.stringify(filter));
    
    if (!range.__parameter)
      range.__parameter = this.store.add(new AjaxSolr.Parameter({ name: 'fq', value: "", locals: { tag: "studies_range" } }));
      
    var vals = [];
    for (var f in range.filter)
      vals.push(f + ":" + AjaxSolr.Parameter.escapeValue(range.filter[f]));
      
    vals.push("-loValue:[" + range.range.join(" TO ") + "]");  
    range.__parameter.value = "-(" + vals.join(" AND ") + ")";
  }

});

}));
