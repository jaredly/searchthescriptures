
function titleize(x){
  return x.replace(/_/g,' ').replace(/(^| )\w/g,function(x){return x.toUpperCase();})+'.';
}

var SearchTheScriptures = Class([],{
  books:{},
  bookdata:{},
  whole:false,
  term:'',
  __init__:function(self){
    $(self.load);
  },
  load:function(self){
    self._send({data:{'cmd':'load_booklist'},func:self.load_books});
    $('#searchbox button').click(self.search).mousemove(function(e){
      $(this).css('top',parseInt(e.clientY)+10+'px').css('left',parseInt(e.clientX)+10+'px');
    });
    $('#works').change(function(){
      self.reload_booklist();
    });
    $('#back').click(function(){
      $(this).hide();
      $('#singleshow').hide();
    });
    $('#search').keydown(function(e){
      if (e.keyCode==13){
        self.search();
      }
    });
  },
  load_books:function(self,data){
    $('#booklist').html(data);
    $('.work').each(function(){
      $('<option value="'+this.id.split('-')[1]+'">'+$('>.title',this).html()+'</option>').appendTo('#works');
    });
    $('.book').each(function(){
      self.bookdata[this.id.split('-')[1]] = $('>.title',this).html();
    });
    self.reload_booklist();
  },
  reload_booklist:function(self){
    var work = $('#works').val();
    $('.work').not('#work-'+work).css('position','absolute').animate({'left':'110%'},800);
    $('#work-'+work).css('position','absolute').css('left','-100%').show().animate({'left':'0'},800);
    $('.chapter').mouseout(function(){
      $('#hovertext').hide();
    }).mousemove(function(e){
      if (!$.data(this,'num'))return;
      $('#hovertext').html($.data(this,'num')+' results found').show().css('top',e.clientY+10+'px').css('left',e.clientX+10+'px');
    }).click(function(){
      self.clearIframe();
      self.show_chap(titleize($(this).parent().attr('id').split('-')[1])+' '+this.innerHTML);
    });
  },
  
  clearIframe:function(self){
    $('#singleshow .breadcrumb').html('');
    $('#singleshow .results').html('');
    
  },
  
  show_chap:function(self,reference){
    $('#back').show();
    //if (!nonav)
    //  $('#singleshow .breadcrumb').html('');
    self._send({data:{'cmd':'show_chapter','ref':reference,'term':self.term,'whole_word':self.whole},func:self.showIframe(reference)});
  },
  
  show_whole_chap:function(self,reference){
    $('#back').show();
    self._send({data:{'cmd':'show_whole_chapter','ref':reference,'term':self.term,'whole_word':self.whole},func:self.showIframe(reference)});
  },
  
  showIframe:function(self, reference, verse){
    function jumpto(verse){
      document.location = '#' + verse;
      $('#verse-'+verse).css('background-color','#ffb');
    }
    return function(data){
      $('#hovertext').hide().removeClass('fixed');
      $('#singleshow').show().find('.results').html(data).find('.verse a').each(function(){
        $.data(this, 'footnote', $(this).attr('title').replace(/;/g,'<br/>'));
        $(this).attr('title','').attr('href','javascript:void(0)');
      }).mousemove(function(e){
        $('#hovertext').not('.fixed').show().html($.data(this,'footnote')).css('top',parseInt(e.clientY)+10+'px').css('left',parseInt(e.clientX)+10+'px');
      }).mouseout(function(){
        $('#hovertext').not('.fixed').hide();
      }).click(function(e){
        /** show fixed footnote **/
        var options = $.data(this,'footnote').split('<br/>');
        if (options.length==1){
          self.gotoFootnote(options[0]);
        }else{
          $('#hovertext').addClass('fixed').css('top',parseInt(e.clientY)+10+'px').css('left',parseInt(e.clientX)+10+'px').show().html('').mousedown(function(e){
            e.preventDefault();
            e.stopPropagation();
            return false;
          });
          for (var i=0;i<options.length;i++){
            var cls='';
            if (self.validateFootnote(options[i]))cls = 'clickable';
            $('<div class="'+cls+'">'+options[i]+'</div>').appendTo('#hovertext').click(function(){
              self.gotoFootnote(this.innerHTML);
            });
          }
          function out(){
            $('#hovertext').hide().removeClass('fixed');
            $(document).unbind('mousedown',out);
          }
          $(document).bind('mousedown',out);
        }
      });
      $('#singleshow .expand').click(function(){
        self.show_whole_chap(reference);
      });
      $('#singleshow .collapse').click(function(){
        self.show_chap(reference);
      });
      $('#singleshow .jump a.result').click(function(){
        jumpto(this.innerHTML);
      });
      var crumb = $('#singleshow .results .crumb');
      var thecrumb = null;
      var done = false;
      $('#singleshow .breadcrumb .crumb').removeClass('selected').each(function(){
        if ($('span',this).html() == $('span',crumb).html()){
          done=true;
          thecrumb = $(this).addClass('selected');
        }
      });
      if (!done){
        thecrumb = crumb.clone().appendTo('#singleshow .breadcrumb').addClass('selected').click(function(){
          self.show_whole_chap($('span',this).html());
        }).find('.delete').click(function(){
          $(this).parent().remove();
          if (!$('#singleshow .breadcrumb .crumb').length){
            $('#back').hide();
            $('#singleshow').hide();
          }
        });
      }
      if (reference.split(':').length==2){
        var verse = reference.split(':')[1].replace(/\([^)]+\)/g,'').replace(/[^\d]/g,'');
        jumpto(verse);
      }
      $('#singleshow .jumprow').html('').append($('#singleshow .results .jump'));
      //debugger;
      if (verse){
        jumpto(verse);
      }
    };
  },
  
  validateFootnote:function(self,note){
    note = note.replace(/^\s+/g,'').replace(/\s+$/g,'');
      for (var name in self.bookdata){
        if (note.indexOf(titleize(name))==0 || note.indexOf(self.bookdata[name])==0){
          return true;
        }
      }
      return false;
  },
  
  gotoFootnote:function(self,note){
    $('#hovertext').hide().removeClass('fixed');
    note = note.replace(/^\s+/g,'').replace(/\s+$/g,'');
    if (note.indexOf('TG')==0){
    
    }else if (note.indexOf('BD')==0){
    
    }else if (note.indexOf('OR')==0){
    
    }else if (note.indexOf('HEB')==0){
    
    }else{ // assume its a reference
      for (var name in self.bookdata){
        if (note.indexOf(titleize(name))==0 || note.indexOf(self.bookdata[name])==0){
          self.show_whole_chap(note);
          return;
        }
      }
//      self.show_whole_chap(note);
    }
  },
  
  search:function(self){
    self._send({data:{'cmd':'search','term':$('#search').val(),'work':$('#works').val(),'whole_word':$('#whole-word')[0].checked},func:self._search})
    self.term = $('#search').val();
    self.whole =$('#whole-word')[0].checked;
  },
  _search:function(self,data){
    eval('var results = '+data);
    var books = {};
    $('.chapter').css('background-color','#bbddff').removeClass('results').each(function(){
      $.data(this,'num',0);
    });
    for (var i=0;i<results.length;i++){
      if (typeof(books[results[i][0]])==='undefined'){
        books[results[i][0]] = 0;
      }
      books[results[i][0]] += 1;
      
      var chap = $('#book-'+results[i][0]+' .ch'+results[i][1]);
      $.data(chap[0],'num',1+$.data(chap[0],'num'));
      var chrs = '0123456789abc';
      var num = $.data(chap[0],'num');
      if (num>chrs.length*3){
        num = chrs.length*3;
      }
      var c = chrs[parseInt(chrs.length-num/3)];
      chap.css('background-color','#f'+c+c).addClass('results');
    }
    for (var name in self.bookdata){
      if (!books[name])books[name]=0;
      $('#'+name+' .title').html(self.bookdata[name][0]+' - '+books[name]+' results');
    }
  },
  _send: function(self, options, queued){
    if (!options.url)options.url = 'index.py';
    $('#loading').show();
    $.post(options.url, options.data, function(){
      self.sending = false;
      $('#loading').hide();
      if (queued){
        if (options !== self._queue[0]){
          throw "Invalid Queue";
        }
        self._queue.shift();
        self._update_queue();
      }
      options.func.apply(self,arguments);
    });
  },
  
  _send_queued : function(self, options){
    var defaults = {
      url:'index.py',
      data:{},
      func:function(){},
      method:'POST'
    };
    options = $.extend(defaults,options);
    self._queue.push(options);
    self._update_queue();
  },
  
  _update_queue: function(self){
    if (self._queue.length && !self.sending){
      self.sending = true;
      self._send(self._queue[0],true);
    }
  },
  
});

var StS = SearchTheScriptures();
