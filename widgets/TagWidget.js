(function ($) {

AjaxSolr.TagWidget = AjaxSolr.BaseFacetWidget.extend({
  afterRequest: function () {
    if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
      this.target.html('no items found in current selection');
      return;
    }

    var objectedItems = [], 
    		facet = null, 
    		total = 0,
    		hdr = getHeaderText(this.header),
    		refresh = this.header.data("refreshPanel"),
    		filter = this.fieldFilter(),
    		el;
        
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
      this.target.append(el = this.tagRenderer(facet = objectedItems[i].facet, objectedItems[i].count, this.clickHandler(facet)));
      
      if (!!filter && AjaxSolr.BaseFacetWidget.matchRemoveValue(filter, facet))
        el.addClass("selected");
    }
      
    hdr.textContent = jT.ui.updateCounter(hdr.textContent, total);
    if (!!refresh)
    	refresh.call();
  }
});

})(jQuery);
