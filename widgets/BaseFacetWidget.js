(function ($) {

AjaxSolr.BaseFacetWidget = AjaxSolr.AbstractFacetWidget.extend({
  fieldRegExp: function (field) {
    return new RegExp('^-?' + (field || this.field) + ':');
  },
  
  init: function () {
    AjaxSolr.BaseFacetWidget.__super__.init.call(this);
    this.manager.store.addByValue('facet.field', this.field, { ex: this.field });
  },
  
  add: function (value) {
    return this.changeSelection(function () {
      var re = this.fieldRegExp(),
          index = this.manager.store.find('fq', re);
            
      value = AjaxSolr.Parameter.escapeValue(value);
      if (!index)
        this.manager.store.addByValue('fq', this.field + ':(' + value + ')', { tag: this.field })
      else {
        var pars = this.manager.store.params['fq'],
            val = pars[index].val().replace(re, "").slice(1, -1);
            
        if (val.match(AjaxSolr.BaseFacetWidget.valueRegExp(value)))
          return false;
          
        pars[index] = new AjaxSolr.Parameter({name: 'fq', value: this.field + ':(' + val + " " + value + ')', locals: { tag: this.field }});
      }

      return true;
    });
  },
  
  set: function (value, exclude) {
    return this.changeSelection(function () {
      var a = this.manager.store.removeByValue('fq', this.fieldRegExp()),
          b = this.manager.store.addByValue('fq', this.fq(value, exclude));
      return a || b;
    });
  },
  
  values: function (field) {
    var re = this.fieldRegExp(field),
        indices = this.manager.store.find(re);
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
        
    return !index ? null : this.manager.store.params['fq'][index].val().replace(re, "").slice(1, -1);
  }
});

AjaxSolr.BaseFacetWidget.valueRegExp = function (value) {
  return new RegExp("\\s?" + value + "\\s?"); 
}

AjaxSolr.BaseFacetWidget.parseValues = function (str) {
  return !str.match(/^\([\s\w]*\)$/) ? [str] : str.slice(1, -1).split(" ");
}

})(jQuery);
