(function ($) {

AjaxSolr.TagWidget = AjaxSolr.AbstractFacetWidget.extend({
  afterRequest: function () {
    if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
      $(this.target).html('no items found in current selection');
      return;
    }

    var objectedItems = [], facet = null;
        
    for (var facet in this.manager.response.facet_counts.facet_fields[this.field]) {
      var count = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facet]);

      objectedItems.push({ facet: facet, count: count });
    }
    objectedItems.sort(function (a, b) {
      return a.facet < b.facet ? -1 : 1;
    });

    $(this.target).empty();
    for (var i = 0, l = objectedItems.length; i < l; i++)
      $(this.target).append(this.tagRenderer(facet = objectedItems[i].facet, count = objectedItems[i].count, this.clickHandler(facet)));
      
		$(this.target).closest('div.widget-content').data('initWidget').call();
  }
});

})(jQuery);
