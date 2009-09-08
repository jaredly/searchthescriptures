
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
      $('#hovertext').html($.data(this,'num')+' results found').show().css('top',e.clientY+10+'px').css('left',e.clientX+10+'px');
    }).click(function(){
      self.show_chap(self.bookdata[$(this).parent().attr('id').split('-')[1]]+' '+this.innerHTML);
    });
  },
  
  show_chap:function(self,reference){
    $('#back').show();
    if (!nonav)
      $('#singleshow .breadcrumb').html('');
    self._send({data:{'cmd':'show_chapter','ref':reference,'term':self.term,'whole_word':self.whole},func:self.showIframe(book,chap,nonav,verse)});
  },
  
  show_whole_chap:function(self,reference){
    $('#back').show();
    self._send({data:{'cmd':'show_whole_chapter','ref':reference,'term':self.term,'whole_word':self.whole},func:self.showIframe(book,chap,!yesnav,verse)});
  },
  
  showIframe:function(self, book, chap, nonav,verse){
    function jumpto(verse){
      document.location = '#' + verse;
      $('#verse-'+verse).css('background-color','#ff7');
    }
    return function(data){
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
            $('<div>'+options[i]+'</div>').appendTo('#hovertext').click(function(){
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
      $('#singleshow .show-all').click(function(){
        self.show_whole_chap(book,chap);
      });
      $('#singleshow .collapse').click(function(){
        self.show_chap(book,chap,true);
      });
      $('#singleshow .jump a.result').click(function(){
        jumpto(this.innerHTML);
      });
      if (!nonav && !$('#singleshow .breadcrumb .'+book+'/'+chap).length){
        $('<div class="'+book+'/'+chap+'">'+self.bookdata[book]+' '+chap+'</div>').appendTo('#singleshow .breadcrumb').click(function(){
          //self.show_whole_chap(self.
        });
      }else{
        $('#singleshow .breadcrumb div').removeClass('selected');
        $('#singleshow .breadcrumb .'+book+'/'+chap).addClass('selected');
      }
      $('#singleshow .results .jump').appendTo('#singleshow .breadcrumb');
      //debugger;
      if (verse){
        jumpto(verse);
      }
    };
  },
  
  gotoFootnote:function(self,note){
    note = note.replace(/^\s+/g,'').replace(/\s+$/g,'');
    if (note.indexOf('TG')==0){
    
    }else if (note.indexOf('BD')==0){
    
    }else if (note.indexOf('HEB')==0){
    
    }else{ // assume its a reference
      var parts = note.replace(': ',':').split(' ');
      bk = parts[0].toLowerCase().replace(/\.$/g,'');
      //debugger;
      var cv = parts[1].replace(/\.$/g,'').split(':');
      self.show_whole_chap(bk,cv[0],true,cv[1]);
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
    $('.chapter').css('background-color','#bbddff').each(function(){
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
      chap.css('background-color','#f'+c+c);
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
