(function (Solr, a$, $, jT) {

jT.TagWidgeting = function (settings) {
  a$.extend(this, settings);
};

jT.TagWidgeting.prototype = {
  __expects: [ Solr.Faceting ],

  afterRequest: function () {
    a$.pass(this, jT.TagWidgeting, 'afterRequest');
      
    if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
      this.target.html('no items found in current selection');
      return;
    }

    var objectedItems = [], 
    		facet = null, 
    		total = 0,
    		hdr = getHeaderText(this.header),
    		refresh = this.header.data("refreshPanel"),
    		nullf = function (e) { return false; },
    		el, selected;
        
    for (var facet in this.manager.response.facet_counts.facet_fields[this.field]) {
      var count = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facet]);

      objectedItems.push({ facet: facet, count: count });
      total += count;
    }
    objectedItems.sort(function (a, b) {
      return a.facet < b.facet ? -1 : 1;
    });

    this.target.empty();
    for (var i = 0, l = objectedItems.length; i < l; i++) {
      facet = objectedItems[i].facet;
      selected = this.facetSelected(facet);
      
      this.target.append(el = this.renderTag(facet, objectedItems[i].count, selected ? nullf : this.clickHandler(facet)));
      
      if (selected)
        el.addClass("selected");
    }
      
    hdr.textContent = jT.ui.updateCounter(hdr.textContent, total);
    if (!!refresh)
    	refresh.call();
  },
  
  facetSelected: function (value) {
    var indices = this.manager.findParameters('fq', this.fieldRegExp),
        value = Solr.escapeValue(value);
        
    for (var p, i = 0, il = indices.length; i < il; ++i) {
      p = this.manager.getParameter('fq', indices[i]);
      if (p.value.replace(this.fieldRegExp, "").indexOf(value) > -1)
        return true;
    }
    
    return false;
  }
};

jT.TagWidget = a$(jT.TagWidgeting);

})(Solr, asSys, jQuery, jToxKit);
