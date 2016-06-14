(function ($) {

AjaxSolr.TagcloudWidget = AjaxSolr.AbstractFacetWidget.extend({
  afterRequest: function () {
    if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
      $(this.target).html('no items found in current selection');
      return;
    }

    var maxCount = 0,
        objectedItems = [];
        
    for (var facet in this.manager.response.facet_counts.facet_fields[this.field]) {
      var count = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facet]);
      if (count > maxCount) {
        maxCount = count;
      }
      objectedItems.push({ facet: facet, count: count });
    }
    
    objectedItems.sort(function (a, b) {
      return a.facet < b.facet ? -1 : 1;
    });

    $(this.target).empty();
    for (var i = 0, l = objectedItems.length; i < l; i++) {
      var facet = objectedItems[i].facet;
      var view = facet;
      if (facet.lastIndexOf("http://dx.doi.org/",0)==0) 
    	 view = facet.replace("http://dx.doi.org/","doi:");
      else {
    	  view = lookup[facet];
    	  if (view === undefined) {
    		  view = facet.replace("NPO_","");
    		  
    	  } else {
    		  view = view.replace(" nanoparticle","");
    	  }
      }
      $(this.target).append(
        $('<a href="#" class="tagcloud_item" title="' + facet + '">' + view + ' (' + objectedItems[i].count + ')</a>')
          .addClass('tagcloud_size_' + parseInt(objectedItems[i].count / maxCount * 10))
          .click(this.clickHandler(facet))
      );
    }
  }
});

})(jQuery);
