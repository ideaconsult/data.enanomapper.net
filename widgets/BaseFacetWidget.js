(function ($) {

AjaxSolr.BaseFacetWidget = AjaxSolr.AbstractFacetWidget.extend({
  fieldRegExp: function (field) {
    return new RegExp('(^|\s)-?(' + (field || this.field) + '):(.+)');
  },
  
  init: function () {
    AjaxSolr.BaseFacetWidget.__super__.init.call(this);
    this.manager.store.addByValue('facet.field', this.field, this.multivalue ? { ex: this.id } : undefined);
  },
  
  getParam: function () {
    return this.fieldParam = this.manager.getFacetParam(this.fieldRegExp());
  },
  
  add: function (value) {
    return this.changeSelection(function () {
      var par = this.getParam();
            
      if (!par) {
        this.fieldParam = this.manager.store.addByValue(
          'fq', 
          this.field + ':(' + AjaxSolr.Parameter.escapeValue(value) + ')', this.multivalue ? { tag: this.id } : undefined
        );
        return true;
      }
      else
        return !!this.manager.tweakParamValues(par, value);
    });
  },
  
  set: function (value, exclude) {
    return this.changeSelection(function () {
      var a = this.manager.store.removeByValue('fq', this.fieldRegExp()),
          b = this.manager.store.addByValue('fq', this.fq(value, exclude));
      return a || b;
    });
  },
  
  clickHandler: function (value, field) {
    var self = this,
        meth = this.multivalue ? 'add' : 'set';
        
    return function (e) {
      if (field != null)
        self.field = field;
        
      // shift / Ctrl actually _negate_ the selection
      if (e.shiftKey || e.ctrlKey)
        self.set(value, true);
      else
        self[meth].call(self, value);
        
      return false;
    }
  },
  
  afterChangeSelection: function () {
    this.doRequest();
  },
  
  fieldFilter: function (field) {
    var re = this.fieldRegExp(field || this.field),
        index = this.manager.store.find('fq', re),
        pars;
        
    return !index ? null : this.manager.store.get('fq')[index].val().replace(re, "");
  }
});

})(jQuery);
